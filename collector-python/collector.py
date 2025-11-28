#!/usr/bin/env python3
"""
Collector de dados climáticos que obtém informações de APIs e envia
para o backend (modo direct) ou RabbitMQ (modo rabbit).
"""

import os
import time
import json
import logging
import requests
import pika
import pika.exceptions
from datetime import datetime, UTC
from typing import Dict, Optional, List
from dotenv import load_dotenv
from pathlib import Path

# Configurar logging estruturado
class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.now(UTC).isoformat(),
            'level': record.levelname,
            'service': 'collector',
            'message': record.getMessage(),
        }
        # Adicionar campos extras se existirem
        if hasattr(record, 'module'):
            log_data['module'] = record.module
        if hasattr(record, 'operation'):
            log_data['operation'] = record.operation
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)
        return json.dumps(log_data)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] [collector] %(message)s'
)
logger = logging.getLogger(__name__)

# Handler customizado para logs estruturados (opcional, para produção)
if os.getenv('STRUCTURED_LOGS', 'false').lower() == 'true':
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Carregar variáveis de ambiente do arquivo .env (se existir)
# Procura na raiz do projeto (../.env) e no diretório atual (./.env)
env_paths = [
    Path(__file__).parent.parent / '.env',  # Raiz do projeto
    Path(__file__).parent / '.env',          # Diretório collector-python
]
env_loaded = False
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"[collector] Carregado .env de: {env_path}")
        env_loaded = True
        break

if not env_loaded:
    # Se nenhum .env encontrado, tenta carregar do diretório atual (comportamento padrão)
    load_dotenv()

# Variáveis de ambiente
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')
COLLECTOR_MODE = os.getenv('COLLECTOR_MODE', 'direct')
COLLECT_INTERVAL = int(os.getenv('COLLECT_INTERVAL', '60'))
OPENWEATHER_KEY = os.getenv('OPENWEATHER_KEY', '')

# Detectar se está rodando localmente (Windows não tem /.dockerenv)
def is_running_locally() -> bool:
    """Detecta se está rodando localmente (não em Docker)."""
    # Verificar se existe o arquivo /.dockerenv (presente em containers Docker)
    if Path('/.dockerenv').exists():
        return False
    # Verificar variável de ambiente DOCKER_CONTAINER
    if os.getenv('DOCKER_CONTAINER') == 'true':
        return False
    # Windows não tem /proc, então se chegou aqui e não está em Docker, é local
    return True

# Ajustar RABBITMQ_URL se necessário (detectar uso de nome de serviço Docker quando rodando localmente)
if is_running_locally() and 'rabbitmq:' in RABBITMQ_URL and 'localhost' not in RABBITMQ_URL:
    logger.warning(f"[collector] Detectado: rodando localmente mas RABBITMQ_URL usa nome de serviço Docker")
    logger.warning(f"[collector] Ajustando automaticamente para localhost...")
    RABBITMQ_URL = RABBITMQ_URL.replace('rabbitmq:', 'localhost:')
    logger.info(f"[collector] RABBITMQ_URL ajustada para: {RABBITMQ_URL}")

def ensure_protocol(url: str) -> str:
    """
    Garante que a URL tenha um protocolo válido (http:// ou https://).
    Se não tiver protocolo, adiciona https:// por padrão (assumindo produção).
    Para URLs locais/Docker (localhost, backend:3000, etc), usa http://
    """
    url = url.strip()
    if not url:
        return url
    
    # Se já tem protocolo, retornar como está
    if url.startswith('http://') or url.startswith('https://'):
        return url
    
    # Verificar se é uma URL local/Docker que deve usar http://
    local_hosts = ['localhost', '127.0.0.1', 'backend:']
    for host in local_hosts:
        if url.startswith(host):
            return f'http://{url}'
    
    # Se contém "backend" no início e não tem ponto (provavelmente nome de serviço Docker)
    if url.startswith('backend') and '.' not in url:
        return f'http://{url}'
    
    # Para todas as outras URLs (assumindo produção com domínio externo), usar https://
    return f'https://{url}'

# Garantir que BACKEND_URL tenha protocolo
BACKEND_URL = ensure_protocol(BACKEND_URL)

# Ajustar BACKEND_URL se necessário
if is_running_locally() and 'backend:' in BACKEND_URL and 'localhost' not in BACKEND_URL:
    logger.warning(f"[collector] Detectado: rodando localmente mas BACKEND_URL usa nome de serviço Docker")
    logger.warning(f"[collector] Ajustando automaticamente para localhost...")
    BACKEND_URL = BACKEND_URL.replace('backend:', 'localhost:')
    # Garantir protocolo novamente após ajuste
    BACKEND_URL = ensure_protocol(BACKEND_URL)
    logger.info(f"[collector] BACKEND_URL ajustada para: {BACKEND_URL}")


# Coordenadas das capitais brasileiras
CAPITAL_COORDINATES = {
    'Aracaju': {'lat': -10.9091, 'lon': -37.0677},
    'Belém': {'lat': -1.4558, 'lon': -48.5044},
    'Belo Horizonte': {'lat': -19.9167, 'lon': -43.9345},
    'Boa Vista': {'lat': 2.8197, 'lon': -60.6714},
    'Brasília': {'lat': -15.7942, 'lon': -47.8822},
    'Campo Grande': {'lat': -20.4428, 'lon': -54.6464},
    'Cuiabá': {'lat': -15.6014, 'lon': -56.0979},
    'Curitiba': {'lat': -25.4284, 'lon': -49.2733},
    'Florianópolis': {'lat': -27.5954, 'lon': -48.5480},
    'Fortaleza': {'lat': -3.7172, 'lon': -38.5433},
    'Goiânia': {'lat': -16.6864, 'lon': -49.2643},
    'João Pessoa': {'lat': -7.1150, 'lon': -34.8631},
    'Macapá': {'lat': 0.0349, 'lon': -51.0694},
    'Maceió': {'lat': -9.5713, 'lon': -36.7820},
    'Manaus': {'lat': -3.1190, 'lon': -60.0217},
    'Natal': {'lat': -5.7945, 'lon': -35.2110},
    'Palmas': {'lat': -10.1844, 'lon': -48.3336},
    'Porto Alegre': {'lat': -30.0346, 'lon': -51.2177},
    'Porto Velho': {'lat': -8.7619, 'lon': -63.9039},
    'Recife': {'lat': -8.0476, 'lon': -34.8770},
    'Rio Branco': {'lat': -9.9747, 'lon': -67.8100},
    'Rio de Janeiro': {'lat': -22.9068, 'lon': -43.1729},
    'Salvador': {'lat': -12.9714, 'lon': -38.5014},
    'São Luís': {'lat': -2.5387, 'lon': -44.2825},
    'São Paulo': {'lat': -23.5505, 'lon': -46.6333},
    'Teresina': {'lat': -5.0892, 'lon': -42.8019},
    'Vitória': {'lat': -20.3155, 'lon': -40.3128},
}


def fetch_from_open_meteo(city: str, lat: float, lon: float) -> Dict[str, any]:
    """
    Obtém dados climáticos da API Open-Meteo para uma cidade específica.
    
    Args:
        city: Nome da cidade
        lat: Latitude
        lon: Longitude
    
    Returns:
        dict: Dados normalizados com timestamp, temperature, humidity, city
    """
    logger.info(f"[collector] Coletando dados para {city}...")
    
    # Se não houver chave, usar dados mock
    if not OPENWEATHER_KEY:
        logger.warning(f"[collector] OPENWEATHER_KEY não fornecida, usando dados mock para {city}")
        return {
            "timestamp": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            "temperature": 25.5,
            "humidity": 70.0,
            "city": city
        }
    
    try:
        # Chamada para Open-Meteo (API gratuita, não requer chave)
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m",
            "timezone": "America/Sao_Paulo"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        current = data.get('current', {})
        
        payload = {
            "timestamp": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            "temperature": current.get('temperature_2m', 0),
            "humidity": current.get('relative_humidity_2m', 0),
            "city": city
        }
        
        logger.info(f"[collector] Dados coletados para {city}: temp={payload['temperature']}°C, humidity={payload['humidity']}%")
        return payload
        
    except Exception as e:
        logger.error(f"[collector] Erro ao buscar dados da API para {city}: {e}")
        # Retornar dados mock em caso de erro
        return {
            "timestamp": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            "temperature": 25.0,
            "humidity": 65.0,
            "city": city
        }


def fetch_all_capitals() -> List[Dict[str, any]]:
    """
    Coleta dados climáticos para todas as capitais brasileiras.
    
    Returns:
        Lista de payloads normalizados, um para cada capital
    """
    logger.info("[collector] Iniciando coleta de dados para todas as capitais brasileiras...")
    all_payloads = []
    
    for city, coords in CAPITAL_COORDINATES.items():
        try:
            payload = fetch_from_open_meteo(city, coords['lat'], coords['lon'])
            all_payloads.append(payload)
            # Pequeno delay entre requisições para evitar rate limiting
            time.sleep(0.5)
        except Exception as e:
            logger.error(f"[collector] Erro ao coletar dados para {city}: {e}")
            # Continuar com próxima cidade mesmo em caso de erro
    
    logger.info(f"[collector] Coleta concluída: {len(all_payloads)} capitais processadas")
    return all_payloads


def normalize_payload(raw: Dict) -> Dict:
    """
    Normaliza o payload para o formato esperado pelo backend.
    
    Esta função garante que os dados coletados da API externa (Open-Meteo)
    estejam no formato correto antes de serem enviados:
    - Converte temperature e humidity para float (garante tipo numérico)
    - Preserva timestamp e city como recebidos
    - Usa valores padrão (0) se campos numéricos estiverem ausentes
    
    Decisão de design: Normalização separada permite:
    - Validar dados antes do envio
    - Facilitar mudanças futuras no formato da API externa
    - Manter compatibilidade com diferentes fontes de dados
    
    Args:
        raw: Dados brutos da API
        
    Returns:
        dict: Payload normalizado no formato {timestamp, temperature, humidity, city}
    """
    return {
        "timestamp": raw.get("timestamp"),
        "temperature": float(raw.get("temperature", 0)),
        "humidity": float(raw.get("humidity", 0)),
        "city": raw.get("city")
    }


def post_direct(payload: Dict) -> bool:
    """
    Envia dados diretamente para o backend via HTTP POST.
    
    Args:
        payload: Dados a serem enviados
        
    Returns:
        bool: True se sucesso, False caso contrário
    """
    # Remover barra final se existir antes de adicionar o path
    base_url = BACKEND_URL.rstrip('/')
    url = f"{base_url}/weather/logs"
    
    try:
        logger.info(f"[collector] Enviando dados para {url}")
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        response.raise_for_status()
        logger.info(f"[collector] Dados enviados com sucesso (status {response.status_code})")
        return True
        
    except requests.exceptions.ConnectionError as e:
        error_msg = str(e)
        if "getaddrinfo failed" in error_msg or "Name or service not known" in error_msg:
            logger.error(f"[collector] Erro de DNS: Não foi possível resolver o hostname do backend")
            logger.error(f"[collector] Verifique se BACKEND_URL está correto: {BACKEND_URL}")
            logger.error(f"[collector] Se estiver rodando localmente, use 'localhost' em vez do nome do serviço Docker")
        else:
            logger.error(f"[collector] Erro de conexão ao backend: {e}")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"[collector] Erro ao enviar dados para backend: {e}")
        return False


def publish_to_rabbit(payload: Dict) -> bool:
    """
    Publica dados na fila RabbitMQ 'weather'.
    
    Implementa retry com backoff exponencial para lidar com:
    - Falhas temporárias de conexão (RabbitMQ reiniciando)
    - Problemas de rede transitórios
    - DNS não resolvido (quando rodando localmente com URLs Docker)
    
    Estratégia de retry:
    - 3 tentativas (balanceamento entre resiliência e performance)
    - Backoff exponencial (2s, 4s, 8s) para reduzir carga durante problemas
    - Detecta erros de DNS e fornece mensagens de erro mais claras
    - Mensagens são marcadas como persistentes (delivery_mode=2) para não perder dados
    
    Args:
        payload: Dados a serem publicados
        
    Returns:
        bool: True se sucesso, False caso contrário
    """
    # max_retries: 3 tentativas é suficiente para:
    # - Recuperar de reinicializações rápidas do RabbitMQ
    # - Evitar espera excessiva em problemas permanentes (DNS incorreto, etc)
    max_retries = 3
    # retry_delay inicial: 2 segundos permite tempo para:
    # - RabbitMQ processar conexões pendentes
    # - Rede se recuperar de problemas transitórios
    # Backoff exponencial (2s -> 4s -> 8s) reduz carga progressivamente
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            logger.info(f"[collector] Conectando ao RabbitMQ (tentativa {attempt + 1}/{max_retries})...")
            logger.info(f"[collector] URL do RabbitMQ: {RABBITMQ_URL}")
            
            # Parse da URL do RabbitMQ
            params = pika.URLParameters(RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            # Declarar fila (durable para persistência)
            channel.queue_declare(queue='weather', durable=True)
            
            # Publicar mensagem
            message = json.dumps(payload)
            channel.basic_publish(
                exchange='',
                routing_key='weather',
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Tornar mensagem persistente
                )
            )
            
            connection.close()
            logger.info(f"[collector] Mensagem publicada na fila 'weather' com sucesso")
            return True
            
        except (pika.exceptions.AMQPConnectionError, OSError, Exception) as e:
            error_msg = str(e)
            error_type = type(e).__name__
            
            # Detectar erros de DNS/resolução de hostname
            if "getaddrinfo failed" in error_msg or "Name or service not known" in error_msg:
                logger.error(f"[collector] Erro de DNS: Não foi possível resolver o hostname do RabbitMQ")
                logger.error(f"[collector] Verifique se RABBITMQ_URL está correto: {RABBITMQ_URL}")
                logger.error(f"[collector] Se estiver rodando localmente, use 'localhost' em vez do nome do serviço Docker")
                if attempt < max_retries - 1:
                    logger.info(f"[collector] Tentando reconectar em {retry_delay} segundos...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    logger.error(f"[collector] Falha ao conectar após {max_retries} tentativas")
                    return False
            else:
                logger.error(f"[collector] Erro ao publicar no RabbitMQ (tentativa {attempt + 1}): {error_type}: {error_msg}")
                if attempt < max_retries - 1:
                    logger.info(f"[collector] Tentando reconectar em {retry_delay} segundos...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Backoff exponencial
                else:
                    logger.error(f"[collector] Falha ao publicar após {max_retries} tentativas")
                    return False
    
    return False


def main():
    """
    Loop principal de coleta de dados.
    Coleta dados para todas as capitais brasileiras.
    """
    logger.info("[collector] Iniciando collector...")
    logger.info(f"[collector] Modo: {COLLECTOR_MODE}")
    logger.info(f"[collector] Intervalo de coleta: {COLLECT_INTERVAL} segundos")
    logger.info(f"[collector] Coletando dados para {len(CAPITAL_COORDINATES)} capitais brasileiras")
    
    # Validar configuração
    if COLLECTOR_MODE not in ['direct', 'rabbit']:
        logger.error(f"[collector] Modo inválido: {COLLECTOR_MODE}. Use 'direct' ou 'rabbit'")
        return
    
    if COLLECTOR_MODE == 'rabbit':
        logger.info(f"[collector] RabbitMQ URL: {RABBITMQ_URL}")
        if not RABBITMQ_URL:
            logger.error("[collector] RABBITMQ_URL não configurada!")
            return
    else:
        logger.info(f"[collector] Backend URL: {BACKEND_URL}")
        if not BACKEND_URL:
            logger.error("[collector] BACKEND_URL não configurada!")
            return
    
    while True:
        try:
            # Coletar dados para todas as capitais
            all_payloads = fetch_all_capitals()
            
            # Enviar dados de cada capital
            success_count = 0
            for idx, payload in enumerate(all_payloads):
                normalized = normalize_payload(payload)
                
                # Enviar dados conforme o modo configurado
                if COLLECTOR_MODE == 'rabbit':
                    success = publish_to_rabbit(normalized)
                else:
                    success = post_direct(normalized)
                    # Adicionar delay entre requisições no modo direct para evitar rate limiting
                    # Delay de 0.5 segundos entre requisições (exceto na última)
                    if idx < len(all_payloads) - 1:
                        time.sleep(0.5)
                
                if success:
                    success_count += 1
                else:
                    logger.warning(f"[collector] Falha ao enviar dados para {normalized.get('city', 'cidade desconhecida')}, mas continuando...")
            
            logger.info(f"[collector] Enviados {success_count}/{len(all_payloads)} registros com sucesso")
            
            # Aguardar intervalo antes da próxima coleta
            logger.info(f"[collector] Aguardando {COLLECT_INTERVAL} segundos até próxima coleta...")
            time.sleep(COLLECT_INTERVAL)
            
        except KeyboardInterrupt:
            logger.info("[collector] Interrompido pelo usuário")
            break
        except Exception as e:
            logger.error(f"[collector] Erro inesperado: {e}")
            logger.info(f"[collector] Aguardando {COLLECT_INTERVAL} segundos antes de tentar novamente...")
            time.sleep(COLLECT_INTERVAL)


if __name__ == "__main__":
    main()

