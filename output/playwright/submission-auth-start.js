async (page) => {
    const base='http://127.0.0.1:8766';
    const results=[];
    const check=(value,message)=>{if(!value)throw Error(message)};
    try {
    await page.getByRole('button',{name:'Log out',exact:true}).click();
    await page.waitForURL(base+'/login');
    await page.getByRole('link',{name:'Forgot password?',exact:true}).click();
    await page.waitForURL(base+'/forgot-password');
    await page.getByLabel('Email address',{exact:true}).fill('unknown-submission@garden.test');
    await page.getByRole('button',{name:'Send reset link',exact:true}).click();
    await page.getByRole('status').filter({hasText:'If an active account uses that email'}).waitFor();
    results.push({name:'Forgot-password link and generic unknown-account response',status:'PASS'});
    await page.getByRole('link',{name:'Back to sign in',exact:true}).click();
    await page.getByRole('link',{name:'Create an account',exact:true}).click();
    await page.waitForURL(base+'/register');
    await page.getByLabel('Full name',{exact:true}).fill('Submission Browser');
    await page.getByLabel('Email address',{exact:true}).fill('submission-browser@garden.test');
    await page.getByLabel('Password',{exact:true}).fill('Garden123!');
    await page.getByLabel('Confirm password',{exact:true}).fill('Garden123!');
    await page.getByRole('button',{name:'Create member account',exact:true}).click();
    await page.waitForURL(base+'/verify-email');
    await page.getByText('submission-browser@garden.test',{exact:true}).waitFor();
    check((await page.request.get(base+'/api/garden-plots',{headers:{Accept:'application/json'}})).status()===403,'Unverified API access allowed');
    await page.goto(base+'/member/dashboard');
    check(page.url()===base+'/verify-email','Unverified dashboard access allowed');
    await page.getByRole('button',{name:'Resend confirmation email',exact:true}).click();
    await page.getByText('A new confirmation link has been sent.',{exact:true}).waitFor();
    check(await page.getByRole('button',{name:/Resend available in/}).isDisabled(),'Resend cooldown missing');
    await page.setViewportSize({width:390,height:844});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Verification mobile overflow');
    await page.screenshot({path:'output/playwright/submission-email-confirmation.png',fullPage:true});
    await page.setViewportSize({width:1280,height:800});
    results.push({name:'Registration, verification gate, resend, cooldown and mobile confirmation page',status:'PASS'});
    return {results};
    }catch(e){return {results,failure:e.message}}
}
