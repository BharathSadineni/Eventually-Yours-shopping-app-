import random
import time
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urljoin, urlparse
import requests
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Global session pool for better connection reuse
session_pool = {}
session_lock = threading.Lock()

def get_session():
    """Get or create a session for the current thread"""
    thread_id = threading.get_ident()
    with session_lock:
        if thread_id not in session_pool:
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            })
            session_pool[thread_id] = session
        return session_pool[thread_id]

def cleanup_session():
    """Clean up session for current thread"""
    thread_id = threading.get_ident()
    with session_lock:
        if thread_id in session_pool:
            del session_pool[thread_id]

def get_realistic_headers():
    """Generate realistic browser headers to avoid detection"""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    ]
    
    accept_languages = [
        "en-GB,en-US;q=0.9,en;q=0.8",
        "en-US,en;q=0.9,en-GB;q=0.8",
        "en-CA,en-US;q=0.9,en;q=0.8",
        "en-AU,en-US;q=0.9,en;q=0.8",
    ]
    
    return {
        "User-Agent": random.choice(user_agents),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": random.choice(accept_languages),
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def amazon_category_top_products(category, amazon_domain, num_results=3, budget_range=None):
    """
    Get top products from Amazon category search with improved concurrency
    """
    try:
        print(f"Searching for category: {category} on {amazon_domain}")
        
        # Use session pool for better connection reuse
        session = get_session()
        
        # Build search URL
        search_query = quote_plus(category)
        search_url = f"{amazon_domain}/s?k={search_query}&ref=sr_pg_1"
        
        # Add budget filter if provided
        if budget_range:
            try:
                low, high = budget_range.replace("€", "").replace("$", "").replace("£", "").split("-")
                low = float(low.strip())
                high = float(high.strip())
                search_url += f"&rh=p_36%3A{int(low*100)}-{int(high*100)}"
            except:
                pass  # Continue without budget filter if parsing fails
        
        print(f"Search URL: {search_url}")
        
        # Make request with session
        response = session.get(search_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Multiple selectors for product links
        product_selectors = [
            'a[href*="/dp/"]',
            'a[href*="/gp/product/"]',
            'a[data-component-type="s-search-result"]',
            '.s-result-item a[href*="/dp/"]',
            '.s-result-item a[href*="/gp/product/"]'
        ]
        
        product_urls = []
        seen_urls = set()
        
        for selector in product_selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href', '')
                if href and '/dp/' in href:
                    # Clean and normalize URL
                    if href.startswith('/'):
                        full_url = urljoin(amazon_domain, href)
                    else:
                        full_url = href
                    
                    # Extract product ID and create clean URL
                    product_id_match = re.search(r'/dp/([A-Z0-9]{10})', full_url)
                    if product_id_match:
                        product_id = product_id_match.group(1)
                        clean_url = f"{amazon_domain}/dp/{product_id}"
                        
                        if clean_url not in seen_urls:
                            seen_urls.add(clean_url)
                            product_urls.append(clean_url)
                            
                            if len(product_urls) >= num_results:
                                break
            
            if len(product_urls) >= num_results:
                break
        
        print(f"Found {len(product_urls)} product URLs for category: {category}")
        return product_urls[:num_results]
        
    except Exception as e:
        print(f"Error in amazon_category_top_products for {category}: {e}")
        return []


def parse_price_to_float(price_str):
    if not price_str:
        return None
    
    # Remove currency symbols and clean the string
    cleaned = price_str.replace("£", "").replace("€", "").replace("$", "").replace(",", "").strip()
    
    # Handle different price formats
    if "p" in cleaned.lower():  # UK pence format
        # Convert pence to pounds
        pence_match = re.search(r"(\d+)p", cleaned.lower())
        if pence_match:
            pence = int(pence_match.group(1))
            return pence / 100.0
    
    # Handle decimal prices
    decimal_match = re.search(r"(\d+\.\d+)", cleaned)
    if decimal_match:
        return float(decimal_match.group(1))
    
    # Handle whole number prices
    whole_match = re.search(r"(\d+)", cleaned)
    if whole_match:
        return float(whole_match.group(1))
    
    return None


def scrape_amazon_product(url):
    """
    Scrape individual Amazon product page with improved concurrency
    """
    try:
        print(f"Scraping product: {url}")
        
        # Use session pool for better connection reuse
        session = get_session()
        
        # Make request with session
        response = session.get(url, timeout=8)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract product information with multiple selectors
        product_data = {}
        
        # Title extraction with multiple selectors
        title_selectors = [
            '#productTitle',
            'h1.a-size-large',
            'h1.a-size-base-plus',
            '.a-size-large.product-title-word-break',
            'span#productTitle'
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                product_data['title'] = title_elem.get_text().strip()
                break
        
        # Price extraction with multiple selectors
        price_selectors = [
            '.a-price-whole',
            '.a-price .a-offscreen',
            '.a-price-range .a-offscreen',
            '.a-price .a-price-whole',
            'span.a-price-whole'
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text().strip()
                # Extract numeric price
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    try:
                        product_data['price_value'] = float(price_match.group().replace(',', ''))
                        product_data['price'] = price_text
                        break
                    except ValueError:
                        continue
        
        # Image extraction with multiple selectors
        image_selectors = [
            '#landingImage',
            '.a-dynamic-image',
            'img#imgBlkFront',
            '.a-image-stretch img',
            '#main-image'
        ]
        
        for selector in image_selectors:
            img_elem = soup.select_one(selector)
            if img_elem:
                img_src = img_elem.get('src') or img_elem.get('data-src')
                if img_src:
                    product_data['image_url'] = img_src
                    break
        
        # Rating extraction with multiple selectors
        rating_selectors = [
            '.a-icon-alt',
            '.a-star-rating-text',
            'span[data-hook="rating-out-of-text"]',
            '.a-icon-star-small .a-icon-alt'
        ]
        
        for selector in rating_selectors:
            rating_elem = soup.select_one(selector)
            if rating_elem:
                rating_text = rating_elem.get_text().strip()
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    try:
                        product_data['average_rating'] = float(rating_match.group(1))
                        break
                    except ValueError:
                        continue
        
        # Add URL to product data
        product_data['url'] = url
        
        # Validate that we have at least a title
        if not product_data.get('title'):
            print(f"No title found for product: {url}")
            return None
        
        print(f"Successfully scraped product: {product_data.get('title', 'Unknown')}")
        return product_data
        
    except Exception as e:
        print(f"Error scraping product {url}: {e}")
        return None


if __name__ == "__main__":
    # Example usage and test of amazon_scraper.py
    test_categories = [
        "laptop bags",
        "wireless headphones",
        "smart watches",
        "gaming chairs",
        "external hard drives",
        "coffee makers",
        "fitness trackers",
        "robot vacuum cleaners",
        "electric toothbrushes",
        "portable chargers",
    ]
    test_domain = "amazon.com"

    for category in test_categories:
        # print(f"\nFetching top products for category '{category}' on {test_domain}...")
        top_urls = amazon_category_top_products(category, test_domain, num_results=3)
        # print("Top product URLs:")
        for url in top_urls:
            pass  # Add your logic here
            # print(url)

        # if top_urls:
        #     # print("\nScraping product details for top products:")
        for url in top_urls:
            product_info = scrape_amazon_product(url)
            print(product_info)
