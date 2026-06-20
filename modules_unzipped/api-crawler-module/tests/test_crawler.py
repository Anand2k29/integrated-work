from api_crawler.crawler import APICrawler


def test_crawler_initialization():

    crawler = APICrawler([])

    assert crawler is not None


def test_empty_endpoint_list():

    crawler = APICrawler([])

    results = crawler.crawl()

    assert results == []
