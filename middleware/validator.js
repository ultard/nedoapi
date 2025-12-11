const validateMemeData = (req, res, next) => {
  const { topText, bottomText } = req.body;
  
  if (!topText && !bottomText) {
    return res.status(400).json({ 
      error: 'Необходимо указать хотя бы один текст (topText или bottomText)' 
    });
  }
  
  if (topText && topText.length > 100) {
    return res.status(400).json({ 
      error: 'Верхний текст не должен превышать 100 символов' 
    });
  }
  
  if (bottomText && bottomText.length > 100) {
    return res.status(400).json({ 
      error: 'Нижний текст не должен превышать 100 символов' 
    });
  }
  
  next();
};

module.exports = { validateMemeData };

