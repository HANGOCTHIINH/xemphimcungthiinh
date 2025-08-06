document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration for OPhim ---
    const API_BASE_URL = 'https://ophim1.com/v1/api';
    const OPHIM_HOME_URL = `${API_BASE_URL}/home`;
    const OPHIM_SEARCH_URL = `${API_BASE_URL}/tim-kiem`;
    const OPHIM_GENRE_LIST_URL = `${API_BASE_URL}/the-loai`;
    const OPHIM_COUNTRY_LIST_URL = `${API_BASE_URL}/quoc-gia`;
    
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
    const heroSection = document.getElementById('hero-section');

    // Navigation links
    const navLinks = {
        home: document.getElementById('home-link'),
        genre: document.getElementById('genre-link'),
        country: document.getElementById('country-link'),
        year: document.getElementById('year-link'),
    };

    // --- Core Functions ---

    async function fetchData(url) {
        showLoader();
        try {
            const options = { method: 'GET', headers: { accept: 'application/json' } };
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            movieGrid.innerHTML = `<p class="error-message">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>`;
            return null;
        } finally {
            hideLoader();
        }
    }

    function displayMovies(movies) {
        movieGrid.innerHTML = '';
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
                <div class="movie-card-poster">
                    <img src="${poster_url}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/500x750/21262d/e6edf3?text=Image+Not+Found';">
                    <div class="play-icon">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                    </div>
                </div>
                <div class="movie-card-info">
                    <h3>${name}</h3>
                    ${year ? `<p>${year}</p>` : ''}
                </div>
            `;
            movieGrid.appendChild(movieEl);
        });
    }

    /**
     * Displays the featured movie in the hero section.
     * @param {object} movie - The featured movie object from the details API.
     */
    function displayHero(movie) {
        if (!movie) {
            heroSection.style.display = 'none';
            return;
        }
        const { name, content, slug, thumb_url, poster_url } = movie;
        const backdropUrl = thumb_url || poster_url;

        heroSection.style.backgroundImage = `url(${backdropUrl})`;
        heroSection.innerHTML = `
            <div class="container hero-content">
                <h2>${name}</h2>
                <p>${content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...</p>
                <a href="#" class="hero-button" data-movie-slug="${slug}">Xem chi tiết</a>
            </div>
        `;
        heroSection.style.display = 'flex';
        
        // Add event listener for the hero button
        document.querySelector('.hero-button').addEventListener('click', (e) => {
            e.preventDefault();
            showMovieDetails(e.target.dataset.movieSlug);
        });
    }

    async function showMovieDetails(movieSlug) {
        const movieDetailsURL = `${API_BASE_URL}/phim/${movieSlug}`;
        // Hide the modal content while loading new data
        modalContent.style.opacity = '0';
        modal.style.display = 'flex';
        
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
                    <p class="original-title">${origin_name} (${year})</p>
                    <div class="details-meta">
                        <span>${quality}</span>
                        <span>${lang}</span>
                    </div>
                    <h3>Nội dung phim</h3>
                    <p class="description">${content.replace(/<[^>]*>?/gm, '')}</p>
                    
                    <h3>Thể loại</h3>
                    <div class="details-meta">
                        ${category.map(cat => `<span>${cat.name}</span>`).join('')}
                    </div>

                    <h3>Quốc gia</h3>
                    <div class="details-meta">
                        ${country.map(c => `<span>${c.name}</span>`).join('')}
                    </div>

                    <h3>Đạo diễn & Diễn viên</h3>
                    <p><strong>Đạo diễn:</strong> ${director.join(', ')}</p>
                    <p><strong>Diễn viên:</strong> ${actor.join(', ')}</p>
                </div>
            `;
        } else {
             modalContent.innerHTML = `
                <div class="details-info">
                    <h2>Lỗi</h2>
                    <p>Không thể tải chi tiết phim. Vui lòng thử lại.</p>
                </div>
            `;
        }
        // Fade in the new content
        modalContent.style.opacity = '1';
    }

    async function loadHomePage() {
        updateActiveLink(navLinks.home);
        contentTitle.textContent = 'Phim Mới Cập Nhật';
        dynamicOptionsContainer.innerHTML = '';
        const data = await fetchData(OPHIM_HOME_URL);
        if (data && data.data && data.data.items) {
            // Fetch details for the first movie to get a backdrop for the hero section
            const firstMovieSlug = data.data.items[0].slug;
            const detailsData = await fetchData(`${API_BASE_URL}/phim/${firstMovieSlug}`);
            if(detailsData && detailsData.movie) {
                displayHero(detailsData.movie);
            } else {
                heroSection.style.display = 'none';
            }

            // Display the rest of the movies in the grid
            displayMovies(data.data.items);
        } else {
            heroSection.style.display = 'none';
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
            heroSection.style.display = 'none';
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

    async function handleCategoryClick(type) {
        heroSection.style.display = 'none';
        let listUrl = '';
        let title = '';
        let dataType = '';

        if (type === 'genre') {
            listUrl = OPHIM_GENRE_LIST_URL;
            title = 'Khám Phá Theo Thể Loại';
            dataType = 'genreSlug';
            updateActiveLink(navLinks.genre);
        } else if (type === 'country') {
            listUrl = OPHIM_COUNTRY_LIST_URL;
            title = 'Khám Phá Theo Quốc Gia';
            dataType = 'countrySlug';
            updateActiveLink(navLinks.country);
        } else if (type === 'year') {
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
            return;
        }

        contentTitle.textContent = title;
        movieGrid.innerHTML = '';
        dynamicOptionsContainer.innerHTML = '';
        const data = await fetchData(listUrl);
        if (data && data.data && data.data.items) {
            displayOptionButtons(data.data.items, dataType);
        }
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
    navLinks.genre.addEventListener('click', (e) => { e.preventDefault(); handleCategoryClick('genre'); });
    navLinks.country.addEventListener('click', (e) => { e.preventDefault(); handleCategoryClick('country'); });
    navLinks.year.addEventListener('click', (e) => { e.preventDefault(); handleCategoryClick('year'); });
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
