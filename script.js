document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration for OPhim ---
    const API_BASE_URL = 'https://ophim1.com/v1/api';
    const OPHIM_HOME_URL = `${API_BASE_URL}/home`;
    const OPHIM_SEARCH_URL = `${API_BASE_URL}/tim-kiem`;
    const OPHIM_GENRE_LIST_URL = `${API_BASE_URL}/the-loai`;
    const OPHIM_COUNTRY_LIST_URL = `${API_BASE_URL}/quoc-gia`;
    // The API for years seems to be missing, so we'll generate a list manually.
    
    // --- DOM Elements ---
    const movieGrid = document.getElementById('movie-grid');
    const contentTitle = document.getElementById('content-title');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const loader = document.getElementById('loader');
    const modal = document.getElementById('movie-details-modal');
    const modalContent = document.getElementById('movie-details-content');
    const closeModalBtn = document.querySelector('.close-button');
    const dynamicOptionsContainer = document.getElementById('dynamic-options-container');

    // Navigation links
    const navLinks = {
        home: document.getElementById('home-link'),
        genre: document.getElementById('genre-link'),
        country: document.getElementById('country-link'),
        year: document.getElementById('year-link'),
    };

    // --- Core Functions ---

    /**
     * Fetches data from a given URL.
     * @param {string} url - The API endpoint to fetch from.
     * @returns {Promise<object|null>} - The JSON response data or null on error.
     */
    async function fetchData(url) {
        showLoader();
        try {
            const options = { method: 'GET', headers: { accept: 'application/json' } };
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            movieGrid.innerHTML = `<p class="error-message">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>`;
            return null;
        } finally {
            hideLoader();
        }
    }

    /**
     * Displays a list of movies in the grid.
     * @param {Array} movies - An array of movie objects.
     */
    function displayMovies(movies) {
        movieGrid.innerHTML = ''; // Clear previous results
        if (!movies || movies.length === 0) {
            movieGrid.innerHTML = `<p class="info-message">Không tìm thấy phim nào.</p>`;
            return;
        }

        movies.forEach(movie => {
            const { name, poster_url, slug, year } = movie;
            const movieEl = document.createElement('div');
            movieEl.classList.add('movie-card');
            movieEl.dataset.movieSlug = slug;

            movieEl.innerHTML = `
                <img src="${poster_url}" alt="${name}" onerror="this.onerror=null;this.src='https://placehold.co/500x750/1E1E1E/FFFFFF?text=No+Image';">
                <div class="movie-card-info">
                    <h3>${name}</h3>
                    ${year ? `<p>${year}</p>` : ''}
                </div>
            `;
            movieGrid.appendChild(movieEl);
        });
    }

    /**
     * Fetches and displays details for a specific movie.
     * @param {string} movieSlug - The slug of the movie.
     */
    async function showMovieDetails(movieSlug) {
        const movieDetailsURL = `${API_BASE_URL}/phim/${movieSlug}`;
        const data = await fetchData(movieDetailsURL);

        if (data && data.movie) {
            const movie = data.movie;
            const { name, origin_name, content, poster_url, thumb_url, year, quality, lang, category, country, actor, director } = movie;

            modalContent.innerHTML = `
                <div class="details-poster">
                    <img src="${poster_url || thumb_url}" alt="${name}">
                </div>
                <div class="details-info">
                    <h2>${name}</h2>
                    <p><em>${origin_name} (${year})</em></p>
                    <div class="details-meta">
                        <span>${quality}</span>
                        <span>${lang}</span>
                    </div>
                    <h3>Nội dung phim</h3>
                    <p>${content.replace(/<[^>]*>?/gm, '')}</p> <!-- Strip HTML tags from content -->
                    
                    <h3>Thể loại</h3>
                    <div class="details-meta">
                        ${category.map(cat => `<span>${cat.name}</span>`).join('')}
                    </div>

                    <h3>Quốc gia</h3>
                    <div class="details-meta">
                        ${country.map(c => `<span>${c.name}</span>`).join('')}
                    </div>

                    <h3>Đạo diễn</h3>
                    <p>${director.join(', ')}</p>

                    <h3>Diễn viên</h3>
                    <p>${actor.join(', ')}</p>
                </div>
            `;
            modal.style.display = 'flex';
        } else {
             modalContent.innerHTML = `
                <div class="details-info">
                    <h2>Lỗi</h2>
                    <p>Không thể tải chi tiết phim. Vui lòng thử lại.</p>
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    /**
     * Handles fetching and displaying movies for the home page.
     */
    async function loadHomePage() {
        updateActiveLink(navLinks.home);
        contentTitle.textContent = 'Phim Mới Cập Nhật';
        dynamicOptionsContainer.innerHTML = '';
        const data = await fetchData(OPHIM_HOME_URL);
        if (data && data.data && data.data.items) {
            displayMovies(data.data.items);
        }
    }

    // --- Navigation and Action Handlers ---

    function updateActiveLink(newLink) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        if (newLink) newLink.classList.add('active');
    }

    async function handleSearch(event) {
        event.preventDefault();
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            updateActiveLink(null);
            dynamicOptionsContainer.innerHTML = '';
            contentTitle.textContent = `Kết quả cho: "${searchTerm}"`;
            const url = `${OPHIM_SEARCH_URL}?keyword=${encodeURIComponent(searchTerm)}`;
            const data = await fetchData(url);
            if (data && data.data && data.data.items) {
                displayMovies(data.data.items);
            }
            searchInput.value = '';
        }
    }

    async function handleGenreClick() {
        updateActiveLink(navLinks.genre);
        contentTitle.textContent = 'Khám Phá Theo Thể Loại';
        movieGrid.innerHTML = '';
        dynamicOptionsContainer.innerHTML = '';
        const data = await fetchData(OPHIM_GENRE_LIST_URL);
        if (data && data.data && data.data.items) {
            displayOptionButtons(data.data.items, 'genreSlug');
        }
    }

    async function handleCountryClick() {
        updateActiveLink(navLinks.country);
        contentTitle.textContent = 'Khám Phá Theo Quốc Gia';
        movieGrid.innerHTML = '';
        dynamicOptionsContainer.innerHTML = '';
        const data = await fetchData(OPHIM_COUNTRY_LIST_URL);
        if (data && data.data && data.data.items) {
            displayOptionButtons(data.data.items, 'countrySlug');
        }
    }

    function handleYearClick() {
        updateActiveLink(navLinks.year);
        contentTitle.textContent = 'Khám Phá Theo Năm';
        movieGrid.innerHTML = '';
        dynamicOptionsContainer.innerHTML = '';

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 20 }, (_, i) => ({
            name: currentYear - i,
            slug: currentYear - i
        }));
        displayOptionButtons(years, 'year');
    }

    function displayOptionButtons(options, dataType) {
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = option.name;
            btn.dataset[dataType] = option.slug;
            dynamicOptionsContainer.appendChild(btn);
        });
    }

    async function handleOptionClick(event) {
        const target = event.target;
        if (target.tagName === 'BUTTON' && target.classList.contains('option-btn')) {
            dynamicOptionsContainer.querySelector('.active')?.classList.remove('active');
            target.classList.add('active');

            let url = '';
            if (target.dataset.genreSlug) {
                contentTitle.textContent = `Thể loại: ${target.textContent}`;
                url = `${API_BASE_URL}/the-loai/${target.dataset.genreSlug}`;
            } else if (target.dataset.countrySlug) {
                contentTitle.textContent = `Quốc gia: ${target.textContent}`;
                url = `${API_BASE_URL}/quoc-gia/${target.dataset.countrySlug}`;
            } else if (target.dataset.year) {
                contentTitle.textContent = `Năm: ${target.textContent}`;
                url = `${API_BASE_URL}/nam-phat-hanh/${target.dataset.year}`;
            }

            if (url) {
                const data = await fetchData(url);
                if (data && data.data && data.data.items) {
                    displayMovies(data.data.items);
                }
            }
        }
    }

    // --- Utility Functions ---
    function showLoader() { loader.style.display = 'block'; }
    function hideLoader() { loader.style.display = 'none'; }

    // --- Event Listeners ---
    searchForm.addEventListener('submit', handleSearch);
    navLinks.home.addEventListener('click', (e) => { e.preventDefault(); loadHomePage(); });
    navLinks.genre.addEventListener('click', (e) => { e.preventDefault(); handleGenreClick(); });
    navLinks.country.addEventListener('click', (e) => { e.preventDefault(); handleCountryClick(); });
    navLinks.year.addEventListener('click', (e) => { e.preventDefault(); handleYearClick(); });
    dynamicOptionsContainer.addEventListener('click', handleOptionClick);
    movieGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (card) showMovieDetails(card.dataset.movieSlug);
    });
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // --- Initial Load ---
    loadHomePage();
});
