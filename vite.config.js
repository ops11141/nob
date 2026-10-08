import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function libredwgAssets(){
  let wasmDir;
  return {
    name:'nob-libredwg-assets',
    configResolved(config){
      wasmDir=path.resolve(config.root,'node_modules/@mlightcad/libredwg-web/wasm');
    },
    configureServer(server){
      server.middlewares.use((req,res,next)=>{
        if(req.url?.endsWith('/libredwg-web.wasm')){
          const file=path.join(wasmDir,'libredwg-web.wasm');
          if(fs.existsSync(file)){res.setHeader('Content-Type','application/wasm');res.end(fs.readFileSync(file));return;}
        }
        next();
      });
    },
    generateBundle(){
      const file=path.join(wasmDir,'libredwg-web.wasm');
      if(fs.existsSync(file))this.emitFile({type:'asset',fileName:'assets/libredwg-web.wasm',source:fs.readFileSync(file)});
    }
  };
}
export default defineConfig({base:'./',plugins:[libredwgAssets()],build:{target:'es2022',assetsInlineLimit:0}});
