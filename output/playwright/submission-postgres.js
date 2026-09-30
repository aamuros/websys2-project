async (page) => {
 const base='http://127.0.0.1:8770', results=[], errors=[];
 const listener=error=>errors.push(error.message);page.on('pageerror',listener);
 try {
 if(await page.getByRole('button',{name:'Log out',exact:true}).isVisible()){await page.getByRole('button',{name:'Log out',exact:true}).click();await page.waitForURL(base+'/login');}
 for(const [role,paths] of [['admin',['/members','/reports','/community-updates']],['staff',['/garden-plots','/plot-requests','/assignments','/crops','/garden-calendar']],['member',['/garden-plots','/plot-requests','/assignments','/garden-calendar']]]){
 await page.goto(base+'/login');await page.getByLabel('Email address',{exact:true}).fill(role==='member'?'paolo@garden.test':role+'@garden.test');await page.getByLabel('Password',{exact:true}).fill('Garden123!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base+'/'+role+'/dashboard');await page.getByRole('main').waitFor();
 for(const path of paths){const r=await page.goto(base+path);if(r.status()!==200)throw Error(role+' '+path+' returned '+r.status());await page.getByRole('main').waitFor();}
 if(role==='admin'){const r=await page.request.get(base+'/reports/export');if(r.status()!==200||!r.headers()['content-type'].includes('text/csv'))throw Error('PostgreSQL CSV export failed');}
 else {const r=await page.request.get(base+'/api/garden-plots');if(r.status()!==200)throw Error(role+' plot API failed');}
 await page.getByRole('button',{name:'Log out',exact:true}).click();await page.waitForURL(base+'/login');
 results.push({name:'PostgreSQL '+role+' login, workspace pages, data endpoints and logout',status:'PASS'});
 }
 if(errors.length)throw Error(errors.join('; '));
 return {results,uncaughtBrowserErrors:errors};
 }catch(e){return {results,failure:e.message,uncaughtBrowserErrors:errors}}finally{page.off('pageerror',listener)}
}
