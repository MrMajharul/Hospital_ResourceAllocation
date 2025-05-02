self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
  });
  
  self.addEventListener("fetch", (event) => {
    // Let the browser handle requests normally
  });
  