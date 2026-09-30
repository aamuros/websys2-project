async (page) => {
    const base = 'http://127.0.0.1:8766';
    const results = [];
    const check = (value, message) => { if (!value) throw new Error(message); };
    const pass = name => results.push({name, status:'PASS'});
    const go = async path => { const r = await page.goto(base + path); check(r.status() === 200, path + ' HTTP ' + r.status()); await page.getByRole('main').waitFor(); };
    const login = async (email, password = 'Garden123!') => {
        await page.goto(base + '/login');
        await page.getByRole('textbox',{name:'Email address',exact:true}).fill(email);
        await page.getByRole('textbox',{name:'Password',exact:true}).fill(password);
        await page.getByRole('button',{name:'Sign in',exact:true}).click();
        await page.waitForURL(/\/\w+\/dashboard$/);
    };
    const logout = async () => {
        await page.getByRole('button',{name:'Log out',exact:true}).click();
        await page.waitForURL(base + '/login');
    };
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
    await go('/help');
    await page.getByRole('searchbox',{name:'Search help',exact:true}).fill('no-such-presentation-topic');
    await page.getByText('No help topics match your search.',{exact:true}).waitFor();
    await page.getByRole('searchbox',{name:'Search help',exact:true}).fill('account');
    check(await page.getByRole('article').count() === 1, 'Help search count');
    pass('Help search and empty state');
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.getByRole('textbox',{name:'Full name',exact:true}).fill('Presentation Staff');
    await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await page.getByRole('dialog').getByText('Profile updated.',{exact:true}).waitFor();
    await page.getByRole('textbox',{name:'Full name',exact:true}).fill('Garden Staff');
    await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await page.getByRole('dialog').getByText('Profile updated.',{exact:true}).waitFor();
    pass('Settings profile update and restore');
    await page.getByRole('dialog').getByRole('button',{name:'Password',exact:true}).click();
    await page.getByRole('textbox',{name:'Current password',exact:true}).fill('wrong-password');
    await page.getByRole('textbox',{name:'New password',exact:true}).fill('StaffPresentation123!');
    await page.getByRole('textbox',{name:'Confirm new password',exact:true}).fill('StaffPresentation123!');
    await page.getByRole('button',{name:'Update password',exact:true}).click();
    await page.getByText('The password is incorrect.',{exact:true}).waitFor();
    await page.getByRole('textbox',{name:/^Current password/}).fill('Garden123!');
    await page.getByRole('button',{name:'Update password',exact:true}).click();
    await page.getByRole('dialog').getByText('Password updated.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Close settings',exact:true}).click();
    await logout();
    await login('staff@garden.test','StaffPresentation123!');
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Password',exact:true}).click();
    await page.getByRole('textbox',{name:'Current password',exact:true}).fill('StaffPresentation123!');
    await page.getByRole('textbox',{name:'New password',exact:true}).fill('Garden123!');
    await page.getByRole('textbox',{name:'Confirm new password',exact:true}).fill('Garden123!');
    await page.getByRole('button',{name:'Update password',exact:true}).click();
    await page.getByRole('dialog').getByText('Password updated.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Close settings',exact:true}).click();
    pass('Password validates current password, permits login with new password and restores fixture');
    for (const path of ['/members','/reports','/admin/dashboard','/member/dashboard']) {
        check((await page.request.get(base + path)).status() === 403, 'Staff improperly allowed: ' + path);
    }
    pass('Staff cannot enter admin or member-only pages');
    for (const path of ['/garden-plots','/garden-calendar']) {
        await go(path);
        if (path === '/garden-plots') {
            await page.getByRole('button',{name:/View plot A-01/}).count();
            await page.getByRole('link',{name:'Manage plots',exact:true}).waitFor();
            const plots = await page.request.get(base + '/api/garden-plots');
            check(plots.status() === 200 && (await plots.json()).data.length > 0, 'Plot gallery API failed');
        }
        await page.setViewportSize({width:390,height:844});
        check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path + ' overflows mobile');
        await page.getByRole('button',{name:'Open navigation',exact:true}).click();
        await page.getByRole('dialog').getByRole('link',{name:'Crops',exact:true}).waitFor();
        check(await page.getByRole('dialog').getByRole('link',{name:'Reports',exact:true}).count() === 0, 'Mobile menu exposes admin link');
        await page.getByRole('dialog').getByRole('link',{name:'Dashboard',exact:true}).click();
        await page.waitForURL(base + '/staff/dashboard');
        await page.getByRole('dialog').waitFor({state:'hidden'});
        await page.setViewportSize({width:1280,height:800});
    }
    pass('Plot gallery API, mobile layout and mobile role navigation');
    await logout();
    await page.goto(base + '/staff/dashboard');
    check(page.url() === base + '/login', 'Logout still allows protected dashboard');
    pass('Logout protects staff dashboard');
    await login('paolo@garden.test');
    await go('/plot-requests');
    await page.getByText('Approved',{exact:true}).first().waitFor();
    await page.getByRole('button',{name:/unread notifications/}).click();
    await page.getByRole('menuitem').filter({hasText:'Your request for plot B-02 was approved.'}).click();
    await page.waitForURL(base + '/assignments');
    await page.getByRole('button',{name:/unread notifications/}).click();
    await page.getByRole('button',{name:'Mark all read',exact:true}).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'0 unread notifications',exact:true}).waitFor();
    pass('Member sees staff approval and notifications can be read');
    await logout();
    await login('staff@garden.test');
    check(errors.length === 0, 'JavaScript errors: ' + errors.join('; '));
    return {results};
    } catch (e) { return {results, failure:e.message}; }
}
