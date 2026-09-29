async (page) => {
    const base = 'http://127.0.0.1:8765';
    const results = [];
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const shot = async (name) => {
        const path = `output/playwright/${name}.png`;
        await page.screenshot({ path, fullPage: true, animations: 'disabled' });
        return `${name}.png`;
    };
    const submitLogin = async (email, password) => {
        await page.getByLabel('Email address', { exact: true }).fill(email);
        await page.getByLabel('Password', { exact: true }).fill(password);
        const response = page.waitForResponse(r => r.url() === `${base}/login` && r.request().method() === 'POST');
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        return await response;
    };
    await page.context().clearCookies();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/login`);
    // Bypass native form constraints only in the harness to exercise server validation.
    await page.locator('form').evaluate(form => form.noValidate = true);
    await submitLogin('', '');
    await page.getByText('The email field is required.', { exact: true }).waitFor();
    await page.getByText('The password field is required.', { exact: true }).waitFor();
    results.push({ id: 'B01', section: 'Validation', input: 'Blank email and password', expected: 'Required-field errors', actual: 'Both required-field errors displayed', status: 'PASS', evidence: await shot('01-empty-login') });
    await submitLogin('abc', 'Garden123!');
    await page.getByText('The email field must be a valid email address.', { exact: true }).waitFor();
    results.push({ id: 'B02', section: 'Validation', input: 'abc', expected: 'Invalid-email error', actual: 'Invalid-email message displayed', status: 'PASS', evidence: await shot('02-invalid-email') });
    await submitLogin('member@garden.test', 'incorrect');
    await page.getByText('These credentials do not match our records.', { exact: true }).waitFor();
    results.push({ id: 'B03', section: 'Authentication', input: 'Member email with incorrect password', expected: 'Login denied', actual: 'Credential error; remains on login page', status: 'PASS', evidence: await shot('03-invalid-credentials') });
    await submitLogin('member@garden.test', "' OR 1=1 --");
    await page.getByText('These credentials do not match our records.', { exact: true }).waitFor();
    check(page.url() === `${base}/login`, 'SQL payload bypassed login');
    results.push({ id: 'B04', section: 'SQL injection', input: "Password: ' OR 1=1 --", expected: 'No login bypass', actual: 'Credential error and unauthenticated login page', status: 'PASS', evidence: await shot('04-sql-login-denied') });
    await submitLogin('member@garden.test', 'Garden123!');
    await page.waitForURL(`${base}/member/dashboard`);
    await page.getByRole('heading', { name: /^Welcome,/ }).waitFor();
    results.push({ id: 'B05', section: 'Authentication', input: 'Valid development member credentials', expected: 'Member dashboard', actual: 'Member dashboard loaded', status: 'PASS', evidence: await shot('05-member-login-success') });
    const forbidden = await page.goto(`${base}/members`);
    check(forbidden.status() === 403, 'Member roster access was not forbidden');
    results.push({ id: 'B06', section: 'Authorization', input: 'Member requests /members directly', expected: 'HTTP 403', actual: `HTTP ${forbidden.status()} access restriction`, status: 'PASS', evidence: await shot('06-member-access-denied') });
    await page.goto(`${base}/member/dashboard`);
    await page.setViewportSize({ width: 390, height: 844 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile dashboard overflows horizontally');
    results.push({ id: 'B07', section: 'Interface', input: 'Member dashboard at 390 x 844', expected: 'Fits viewport with mobile navigation', actual: 'No horizontal overflow', status: 'PASS', evidence: await shot('07-mobile-dashboard') });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Log out', exact: true }).first().click();
    await page.waitForURL(`${base}/login`);
    const protectedResponse = await page.goto(`${base}/member/dashboard`);
    check(page.url() === `${base}/login`, 'Protected page accessible after logout');
    results.push({ id: 'B08', section: 'Authentication', input: 'Logout then GET /member/dashboard', expected: 'Redirect to login', actual: 'Final URL /login; login form displayed', status: 'PASS', evidence: await shot('08-logout-protected-page') });
    await submitLogin('staff@garden.test', 'Garden123!');
    await page.waitForURL(`${base}/staff/dashboard`);
    await page.goto(`${base}/community-updates`);
    return results;
}
