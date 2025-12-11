const API_BASE_URL = '/api/memes';

// Элементы DOM
const memeForm = document.getElementById('memeForm');
const memesContainer = document.getElementById('memesContainer');
const messageDiv = document.getElementById('message');
const limitSelect = document.getElementById('limitSelect');
const refreshBtn = document.getElementById('refreshBtn');
const loadingDiv = document.getElementById('loading');

// Обработка отправки формы
memeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(memeForm);
    const topText = formData.get('topText') || '';
    const bottomText = formData.get('bottomText') || '';
    
    if (!topText && !bottomText) {
        showMessage('Укажите хотя бы один текст (верхний или нижний)', 'error');
        return;
    }
    
    try {
        loadingDiv.classList.add('show');
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Мем успешно создан!', 'success');
            memeForm.reset();
            loadMemes();
        } else {
            showMessage(data.error || 'Ошибка при создании мема', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при отправке запроса', 'error');
        console.error('Error:', error);
    } finally {
        loadingDiv.classList.remove('show');
    }
});

// Загрузка списка мемов
async function loadMemes() {
    try {
        loadingDiv.classList.add('show');
        const limit = limitSelect.value === 'all' ? '' : limitSelect.value;
        const url = `${API_BASE_URL}?limit=${limit}&offset=0`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayMemes(data.memes || []);
        } else {
            showMessage('Ошибка при загрузке мемов', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при загрузке мемов', 'error');
        console.error('Error:', error);
    } finally {
        loadingDiv.classList.remove('show');
    }
}

// Отображение мемов
function displayMemes(memes) {
    if (memes.length === 0) {
        memesContainer.innerHTML = `
            <div class="empty-state">
                <h3>😢 Пока нет мемов</h3>
                <p>Создайте первый мем выше!</p>
            </div>
        `;
        return;
    }
    
    memesContainer.innerHTML = memes.map(meme => `
        <div class="meme-card" data-id="${meme.id}">
            <img src="/uploads/${meme.memeImage}" alt="Мем ${meme.id}" onerror="this.src='/uploads/${meme.originalImage}'">
            <div class="meme-text">
                ${meme.topText ? `<strong>Верх:</strong> ${meme.topText}<br>` : ''}
                ${meme.bottomText ? `<strong>Низ:</strong> ${meme.bottomText}` : ''}
            </div>
            <div class="meme-actions">
                <button onclick="editMeme('${meme.id}')">Редактировать</button>
                <button class="delete" onclick="deleteMeme('${meme.id}')">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Удаление мема
async function deleteMeme(id) {
    if (!confirm('Вы уверены, что хотите удалить этот мем?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Мем успешно удалён', 'success');
            loadMemes();
        } else {
            showMessage(data.error || 'Ошибка при удалении мема', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при удалении мема', 'error');
        console.error('Error:', error);
    }
}

// Редактирование мема
async function editMeme(id) {
    const topText = prompt('Введите новый верхний текст (или оставьте пустым):');
    if (topText === null) return;
    
    const bottomText = prompt('Введите новый нижний текст (или оставьте пустым):');
    if (bottomText === null) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topText, bottomText })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Мем успешно обновлён', 'success');
            loadMemes();
        } else {
            showMessage(data.error || 'Ошибка при обновлении мема', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при обновлении мема', 'error');
        console.error('Error:', error);
    }
}

// Показать сообщение
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
        messageDiv.className = 'message';
    }, 5000);
}

// Обработчики событий
limitSelect.addEventListener('change', loadMemes);
refreshBtn.addEventListener('click', loadMemes);

// Загрузка мемов при загрузке страницы
loadMemes();

