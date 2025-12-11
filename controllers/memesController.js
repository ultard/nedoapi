const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createCanvas, loadImage, registerFont } = require('canvas');

registerFont(path.join(__dirname, '..', 'public', 'Inter.ttf'), {
  family: 'Inter'
});

const dataDir = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const memesFile = path.join(dataDir, 'memes.json');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(memesFile)) {
  fs.writeFileSync(memesFile, JSON.stringify([], null, 2));
}

const readMemes = () => {
  try {
    const data = fs.readFileSync(memesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeMemes = (memes) => {
  fs.writeFileSync(memesFile, JSON.stringify(memes, null, 2));
};

const generateMemeImage = async (imagePath, topText, bottomText) => {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  
  ctx.drawImage(image, 0, 0);
  
  const minDimension = Math.min(image.width, image.height);
  const fontSize = Math.max(100, Math.floor(minDimension / 4));

  ctx.font = `bold ${fontSize}px Inter`;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (topText) {
    const x = image.width / 2;
    const y = Math.max(10, Math.floor(fontSize * 0.1));
    ctx.fillText(topText, x, y);
  }
  
  if (bottomText) {
    const x = image.width / 2;
    const y = image.height - fontSize - Math.max(10, Math.floor(fontSize * 0.1));
    ctx.fillText(bottomText, x, y);
  }

  const outputPath = path.join(uploadsDir, `meme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  return path.basename(outputPath);
};

exports.getAllMemes = (req, res) => {
  try {
    const memes = readMemes();
    
    const limit = parseInt(req.query.limit) || memes.length;
    const offset = parseInt(req.query.offset) || 0;
    
    const paginatedMemes = memes.slice(offset, offset + limit);
    
    res.json({
      total: memes.length,
      limit,
      offset,
      memes: paginatedMemes
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении мемов' });
  }
};

exports.getMemeById = (req, res) => {
  try {
    const { id } = req.params;
    const memes = readMemes();
    const meme = memes.find(m => m.id === id);
    
    if (!meme) {
      return res.status(404).json({ error: 'Мем не найден' });
    }
    
    res.json(meme);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении мема' });
  }
};

exports.createMeme = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Необходимо загрузить изображение' });
    }
    
    const { topText = '', bottomText = '' } = req.body;
    const imagePath = req.file.path;
    
    const memeFilename = await generateMemeImage(imagePath, topText, bottomText);
    
    const meme = {
      id: uuidv4(),
      topText,
      bottomText,
      originalImage: req.file.filename,
      memeImage: memeFilename,
      createdAt: new Date().toISOString()
    };
    
    const memes = readMemes();
    memes.push(meme);
    writeMemes(memes);
    
    res.status(201).json(meme);
  } catch (error) {
    console.error('Ошибка при создании мема:', error);
    res.status(500).json({ error: 'Ошибка при создании мема' });
  }
};

exports.updateMeme = async (req, res) => {
  try {
    const { id } = req.params;
    const { topText, bottomText } = req.body;
    
    const memes = readMemes();
    const memeIndex = memes.findIndex(m => m.id === id);
    
    if (memeIndex === -1) {
      return res.status(404).json({ error: 'Мем не найден' });
    }
    
    const meme = memes[memeIndex];
    const originalImagePath = path.join(uploadsDir, meme.originalImage);
    
    const oldMemePath = path.join(uploadsDir, meme.memeImage);
    if (fs.existsSync(oldMemePath)) {
      fs.unlinkSync(oldMemePath);
    }
    
    const memeFilename = await generateMemeImage(originalImagePath, topText || '', bottomText || '');
    
    memes[memeIndex] = {
      ...meme,
      topText: topText || meme.topText,
      bottomText: bottomText || meme.bottomText,
      memeImage: memeFilename,
      updatedAt: new Date().toISOString()
    };
    
    writeMemes(memes);
    
    res.json(memes[memeIndex]);
  } catch (error) {
    console.error('Ошибка при обновлении мема:', error);
    res.status(500).json({ error: 'Ошибка при обновлении мема' });
  }
};

exports.deleteMeme = (req, res) => {
  try {
    const { id } = req.params;
    const memes = readMemes();
    const memeIndex = memes.findIndex(m => m.id === id);
    
    if (memeIndex === -1) {
      return res.status(404).json({ error: 'Мем не найден' });
    }
    
    const meme = memes[memeIndex];
    
    const originalPath = path.join(uploadsDir, meme.originalImage);
    const memePath = path.join(uploadsDir, meme.memeImage);
    
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }
    if (fs.existsSync(memePath)) {
      fs.unlinkSync(memePath);
    }
    
    memes.splice(memeIndex, 1);
    writeMemes(memes);
    
    res.json({ message: 'Мем успешно удалён', id });
  } catch (error) {
    console.error('Ошибка при удалении мема:', error);
    res.status(500).json({ error: 'Ошибка при удалении мема' });
  }
};

