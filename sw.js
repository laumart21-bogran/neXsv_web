self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{
 let data={};try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text()||""}}
 event.waitUntil(self.registration.showNotification(data.title||"neXsv",{body:data.body||"Tienes novedades en tu comunidad.",icon:"/logo.png",badge:"/logo.png",tag:data.tag||"nexsv-community",data:{url:data.url||"/comunidad.html"}}));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();const target=new URL(event.notification.data?.url||"/comunidad.html",self.location.origin).href;
 event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});for(const client of clients){if(client.url.startsWith(self.location.origin)){await client.navigate(target);return client.focus()}}return self.clients.openWindow(target)})());
});