from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display

# Function to fetch content with Selenium
def fetch_content(url):
    display = Display(visible=0, size=(1024, 768))
    display.start()

    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    driver = webdriver.Firefox(options=options)

    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        page_content = driver.find_element(By.TAG_NAME, "body").text
        return {"content": page_content}

    except Exception as e:
        print(f"Error fetching content: {e}")
        return None

    finally:
        driver.quit()
        display.stop()