import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:4173/
        await page.goto("http://localhost:4173/")
        
        # -> Click the 'Login' link to open the login form so we can enter admin credentials.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div[2]/nav/div/div[2]/div/a').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Enter admin credentials into the Network Identity (email) and Security Access Key (password) fields, then click 'Establish Connection' to log in.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div[2]/div[2]/div[2]/form/div/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('systemadmin.qr@insforge.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div[2]/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('admin@123')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div[2]/div[2]/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the 'Live Scanner' button to open the QR scanner modal so we can use the manual QR override.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div[2]/aside/div[2]/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the Students page to locate a valid student ID to use with the Manual Override, so we can verify the scan result overlay displays the student's name, ID, room, phone, and payment status.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div[2]/aside/nav/button[3]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        assert await frame.locator("xpath=//*[contains(., 'ACCESS GRANTED')]").nth(0).is_visible(), "The scan result overlay should display ACCESS GRANTED after scanning a valid student QR code.",
        assert await frame.locator("xpath=//*[contains(., 'Full Name')]").nth(0).is_visible(), "The scan result overlay should show the student's full name after scanning a valid student QR code.",
        assert await frame.locator("xpath=//*[contains(., 'Student ID')]").nth(0).is_visible(), "The scan result overlay should show the student ID after scanning a valid student QR code.",
        assert await frame.locator("xpath=//*[contains(., 'Paid')]").nth(0).is_visible(), "The scan result overlay should show the fee payment status (paid amount, total fees, and percentage) after scanning a valid student QR code.",
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    