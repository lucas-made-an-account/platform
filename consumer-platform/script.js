// DOM Elements
const filterBtn = document.querySelector('.filter-btn');
const filterDrawer = document.getElementById('filterDrawer');
const closeFilterBtn = document.querySelector('.close-filter');
const applyFilterBtn = document.querySelector('.apply-filter');
const backToTopBtn = document.getElementById('backToTop');
const searchInput = document.querySelector('.search-input');
const dishGrid = document.querySelector('.dish-grid');

// Filter Drawer Toggle
filterBtn.addEventListener('click', () => {
    filterDrawer.classList.add('active');
});

closeFilterBtn.addEventListener('click', () => {
    filterDrawer.classList.remove('active');
});

// Apply Filters
applyFilterBtn.addEventListener('click', () => {
    // Get all selected filters
    const filters = {
        time: document.querySelector('input[name="time"]:checked')?.value,
        delivery: Array.from(document.querySelectorAll('input[name="delivery"]:checked')).map(cb => cb.value),
        price: document.querySelector('input[name="price"]:checked')?.value,
        cuisine: Array.from(document.querySelectorAll('.filter-tags .tag.active')).map(tag => tag.textContent),
        chefTags: Array.from(document.querySelectorAll('.filter-tags .tag.active')).map(tag => tag.textContent)
    };
    
    // Apply filters and update dish grid
    applyFilters(filters);
    filterDrawer.classList.remove('active');
});

// Tag Selection
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        tag.classList.toggle('active');
    });
});

// Back to Top Button
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Search Functionality
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
            searchDishes(searchTerm);
        } else {
            loadDishes(); // Reset to show all dishes
        }
    }, 300);
});

// Infinite Scroll
let isLoading = false;
let currentPage = 1;

window.addEventListener('scroll', () => {
    if (isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreDishes();
    }
});

// Functions
async function loadDishes() {
    try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/dishes?page=${currentPage}`);
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        console.error('Error loading dishes:', error);
    }
}

async function searchDishes(term) {
    try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/dishes/search?q=${encodeURIComponent(term)}`);
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        console.error('Error searching dishes:', error);
    }
}

async function loadMoreDishes() {
    if (isLoading) return;
    
    isLoading = true;
    currentPage++;
    
    try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/dishes?page=${currentPage}`);
        const dishes = await response.json();
        
        if (dishes.length > 0) {
            displayDishes(dishes, true);
        }
    } catch (error) {
        console.error('Error loading more dishes:', error);
    } finally {
        isLoading = false;
    }
}

function displayDishes(dishes, append = false) {
    if (!append) {
        dishGrid.innerHTML = '';
    }
    
    dishes.forEach(dish => {
        const dishCard = createDishCard(dish);
        dishGrid.appendChild(dishCard);
    });
}

function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'dish-card';
    
    card.innerHTML = `
        <div class="dish-image">
            <img src="${dish.image}" alt="${dish.name}" loading="lazy">
            ${dish.tag ? `<span class="dish-tag">${dish.tag}</span>` : ''}
        </div>
        <div class="dish-info">
            <h3 class="dish-name">${dish.name}</h3>
            <p class="chef-name">${dish.chefName}</p>
            <div class="dish-details">
                <span class="price">$${dish.price}</span>
                <span class="distance">${dish.distance}km</span>
            </div>
            <div class="dish-meta">
                <span class="rating">${dish.rating} ★</span>
                <span class="reviews">(${dish.reviewCount})</span>
            </div>
        </div>
    `;
    
    return card;
}

function applyFilters(filters) {
    // TODO: Implement filter logic
    console.log('Applying filters:', filters);
    // This would typically make an API call with the filter parameters
    // and update the dish grid with the filtered results
}

// Initialize
loadDishes(); 