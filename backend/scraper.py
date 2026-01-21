"""
SafeSpeakAI Backend - Web Scraper Module
Provides web scraping capabilities using BeautifulSoup and Selenium
"""

import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import time
from config import USER_AGENT, REQUEST_TIMEOUT, MAX_RETRIES


class WebScraper:
    """Web scraping utilities for extracting content from websites"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': USER_AGENT
        })
    
    def scrape_url(self, url: str, selector: Optional[str] = None) -> Dict:
        """
        Scrape content from a URL
        
        Args:
            url: The URL to scrape
            selector: Optional CSS selector to extract specific content
            
        Returns:
            Dictionary with scraped data
        """
        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            if selector:
                elements = soup.select(selector)
                content = [elem.get_text(strip=True) for elem in elements]
            else:
                content = soup.get_text(strip=True)
            
            return {
                'success': True,
                'url': url,
                'content': content,
                'status_code': response.status_code
            }
            
        except requests.RequestException as e:
            return {
                'success': False,
                'url': url,
                'error': str(e)
            }
    
    def scrape_multiple(self, urls: List[str]) -> List[Dict]:
        """
        Scrape multiple URLs
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of scraping results
        """
        results = []
        for url in urls:
            result = self.scrape_url(url)
            results.append(result)
            time.sleep(1)  # Rate limiting
        
        return results
    
    def extract_links(self, url: str) -> List[str]:
        """
        Extract all links from a webpage
        
        Args:
            url: The URL to extract links from
            
        Returns:
            List of URLs found on the page
        """
        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            links = []
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.startswith('http'):
                    links.append(href)
            
            return links
            
        except requests.RequestException:
            return []
    
    def scrape_table(self, url: str, table_index: int = 0) -> List[List[str]]:
        """
        Extract table data from a webpage
        
        Args:
            url: The URL containing the table
            table_index: Index of the table to extract (0-based)
            
        Returns:
            List of rows, where each row is a list of cell values
        """
        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            tables = soup.find_all('table')
            
            if table_index >= len(tables):
                return []
            
            table = tables[table_index]
            rows = []
            
            for tr in table.find_all('tr'):
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if cells:
                    rows.append(cells)
            
            return rows
            
        except (requests.RequestException, IndexError):
            return []


# Selenium-based scraper for dynamic content (optional)
class DynamicScraper:
    """Scraper for JavaScript-rendered content using Selenium"""
    
    def __init__(self):
        self.driver = None
    
    def setup_driver(self):
        """Initialize Selenium WebDriver"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument(f'user-agent={USER_AGENT}')
            
            self.driver = webdriver.Chrome(options=options)
            return True
        except Exception as e:
            print(f"Failed to setup Selenium driver: {e}")
            return False
    
    def scrape_dynamic(self, url: str, wait_time: int = 3) -> Dict:
        """
        Scrape dynamically loaded content
        
        Args:
            url: The URL to scrape
            wait_time: Time to wait for content to load (seconds)
            
        Returns:
            Dictionary with scraped data
        """
        if not self.driver and not self.setup_driver():
            return {'success': False, 'error': 'Failed to initialize driver'}
        
        try:
            self.driver.get(url)
            time.sleep(wait_time)
            
            content = self.driver.page_source
            soup = BeautifulSoup(content, 'lxml')
            
            return {
                'success': True,
                'url': url,
                'content': soup.get_text(strip=True)
            }
            
        except Exception as e:
            return {
                'success': False,
                'url': url,
                'error': str(e)
            }
    
    def close(self):
        """Close the Selenium driver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
