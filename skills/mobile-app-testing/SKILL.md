---
name: mobile-app-testing
description: Test mobile applications across iOS and Android using Appium, manual testing checklists, and automated UI tests. Cover device fragmentation, network conditions, and accessibility.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: testing
  tags:
    - mobile
    - testing
    - appium
    - ios
    - android
    - automation
  personas:
    developer: 70
    researcher: 35
    analyst: 30
    operator: 55
    creator: 20
    support: 60
  summary: Master mobile app testing across iOS and Android with automated and manual approaches
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Mobile App Testing

Mobile testing requires attention to device diversity, OS versions, and real-world conditions.

## Appium Setup

```python
from appium import webdriver
from appium.options.common import AppiumOptions

options = AppiumOptions()
options.platform_name = 'Android'
options.device_name = 'Pixel 4'
options.app = '/path/to/app.apk'
options.automation_name = 'UiAutomator2'

driver = webdriver.Remote('http://localhost:4723', options=options)
```

## iOS Setup

```python
options = AppiumOptions()
options.platform_name = 'iOS'
options.device_name = 'iPhone 14'
options.app = '/path/to/app.ipa'
options.automation_name = 'XCUITest'
options.bundle_id = 'com.example.myapp'
```

## Basic Interactions

```python
# Find element
element = driver.find_element('accessibility id', 'login_button')

# Click
element.click()

# Enter text
element.send_keys('user@example.com')

# Clear
element.clear()

# Get text
text = element.text

# Get attribute
enabled = element.get_attribute('enabled')
```

## Element Finding Strategies

```python
# Accessibility ID (preferred for cross-platform)
driver.find_element('accessibility id', 'submit_button')

# XPath
driver.find_element('xpath', '//button[@text="Submit"]')

# iOS Predicate
driver.find_element('ios predicate', 'label == "Submit" AND type == "XCUIElementTypeButton"')

# Android UIAutomator
driver.find_element('-android uiautomator', 'text("Submit")')
```

## Waiting for Elements

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Wait for element to be clickable
wait = WebDriverWait(driver, 10)
button = wait.until(
    EC.element_to_be_clickable(('accessibility id', 'submit_button'))
)

# Wait for element to be visible
element = wait.until(
    EC.visibility_of_element_located(('xpath', '//h1'))
)
```

## Gestures

```python
from appium.webdriver.common.appiumby import AppiumBy
from appium.webdriver.common.touch_action import TouchAction

# Tap
TouchAction(driver).tap(element).perform()

# Long press
TouchAction(driver).long_press(element).perform()

# Swipe
TouchAction(driver).flick_element(element, 0, -500).perform()

# Pinch zoom
TouchAction(driver).zoom(element).perform()

# Scroll
driver.execute_script('mobile: scroll', {'direction': 'down'})
```

## Assertions

```python
import pytest

def test_login_success():
    # ... perform login ...
    
    # Assert element visible
    dashboard = driver.find_element('accessibility id', 'dashboard')
    assert dashboard.is_displayed()
    
    # Assert text
    title = driver.find_element('xpath', '//h1')
    assert 'Welcome' in title.text
    
    # Assert element NOT present
    with pytest.raises(NoSuchElementException):
        driver.find_element('accessibility id', 'login_form')
```

## Page Object Pattern

```python
class LoginPage:
    def __init__(self, driver):
        self.driver = driver
    
    @property
    def email_field(self):
        return self.driver.find_element('accessibility id', 'email_input')
    
    @property
    def password_field(self):
        return self.driver.find_element('accessibility id', 'password_input')
    
    @property
    def submit_button(self):
        return self.driver.find_element('accessibility id', 'login_button')
    
    def login(self, email, password):
        self.email_field.send_keys(email)
        self.password_field.send_keys(password)
        self.submit_button.click()

# Usage
login_page = LoginPage(driver)
login_page.login('user@example.com', 'password123')
```

## Network Testing

```python
# Enable airplane mode via ADB
subprocess.run([
    'adb', 'shell', 'settings', 'put', 'global', 'airplane_mode_on', '1'
])
subprocess.run(['adb', 'shell', 'am', 'broadcast', '-a', 'android.intent.action.AIRPLANE_MODE'])

# Restore network
subprocess.run([
    'adb', 'shell', 'settings', 'put', 'global', 'airplane_mode_on', '0'
])
```

## Manual Testing Checklist

### Pre-Launch
- [ ] App installs without error
- [ ] App launches on cold start
- [ ] Splash screen displays correctly
- [ ] Onboarding flows work

### Core Functionality
- [ ] All buttons are tappable
- [ ] Forms validate input
- [ ] Navigation works correctly
- [ ] Data persists across sessions

### Device Compatibility
- [ ] Test on 3+ screen sizes
- [ ] Test on latest OS version
- [ ] Test on 1-2 older OS versions
- [ ] Test in both orientations

### Network
- [ ] Works on WiFi
- [ ] Works on cellular
- [ ] Handles airplane mode gracefully
- [ ] Handles poor connectivity
- [ ] Shows appropriate offline states

### Accessibility
- [ ] VoiceOver/TalkBack works
- [ ] Dynamic type scaling works
- [ ] Color contrast is sufficient
- [ ] Touch targets are 44pt+

## Performance Testing

```python
import time

# Cold start time
start = time.time()
driver.launch_app()
element = driver.find_element('accessibility id', 'home_screen')
assert element.is_displayed()
cold_start_ms = (time.time() - start) * 1000

# Memory usage
memory = driver.execute_script('mobile: shell', {
    'command': 'dumpsys meminfo com.example.app',
    'args': [],
    'includeStderr': True
})
```
