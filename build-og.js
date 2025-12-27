const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const input = path.join(__dirname, 'instalacion_finalclima.jpg');
const outDir = path.join(__dirname, 'assets');
const output = path.join(outDir, 'og-image.jpg');

async function ensureDir(dir){
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function build(){
  try{
    if(!fs.existsSync(input)){
      console.error('Archivo de entrada no encontrado:', input);
      process.exit(1);
    }
    await ensureDir(outDir);
    await sharp(input)
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(output);
    console.log('Imagen generada:', output);
  }catch(err){
    console.error('Error generando la imagen:', err);
    process.exit(1);
  }
}

build();
