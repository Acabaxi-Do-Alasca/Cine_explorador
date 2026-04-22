const TOKEN =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYjIxNTRkMGQ1N2QwNjQ5N2NlOGRkOWVkZTRkYzZiYiIsIm5iZiI6MTc3NjY4NjI2Ny45NDIwMDAyLCJzdWIiOiI2OWU2MTRiYjQ1OGFjYzdjZmU1MjBjOTYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.DxSJCdCH6Siam-pgPu3IUkOO4erz7jtSIcT2nqp7Vl0';

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const LOGO = 'https://image.tmdb.org/t/p/original';

let selectedGenres = new Set();

let currentTrendingPage = 1;
let currentSearchPage = 1;
let currentActorPage = 1;

let currentMovieData = null;

/* ==================================================
   DRAG SCROLL
================================================== */
function enableDragScroll(el) {
    let isDown = false;
    let startX;
    let scrollLeft;

    el.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
        el.style.cursor = 'grabbing';
    });

    el.addEventListener('mouseleave', () => {
        isDown = false;
        el.style.cursor = 'grab';
    });

    el.addEventListener('mouseup', () => {
        isDown = false;
        el.style.cursor = 'grab';
    });

    el.addEventListener('mousemove', (e) => {
        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 2;

        el.scrollLeft = scrollLeft - walk;
    });

    el.addEventListener(
        'touchstart',
        (e) => {
            startX = e.touches[0].pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        },
        { passive: true }
    );

    el.addEventListener(
        'touchmove',
        (e) => {
            const x = e.touches[0].pageX - el.offsetLeft;
            const walk = (x - startX) * 1.5;

            el.scrollLeft = scrollLeft - walk;
        },
        { passive: true }
    );
}

/* ==================================================
   FETCH TMDB
================================================== */
async function fetchTMDB(path, params = {}) {
    const url = new URL(`${BASE}${path}`);

    Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, v)
    );

    const r = await fetch(url, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    });

    return r.json();
}

/* ==================================================
   TROCAR ABA
================================================== */
function switchTab(t) {
    document
        .querySelectorAll('.panel, .tab-btn')
        .forEach((el) => el.classList.remove('active'));

    document
        .getElementById(t + 'Panel')
        .classList.add('active');

    document
        .getElementById('btn-' + t)
        .classList.add('active');

    if (t === 'trending' && currentTrendingPage === 1) {
        loadTrending();
    }

    if (t === 'watchlist') {
        loadWatchlistPanel();
    }
}

/* ==================================================
   GÊNEROS
================================================== */
async function loadGenres() {
    const d = await fetchTMDB('/genre/movie/list', {
        language: 'pt-BR'
    });

    const gEl = document.getElementById('genres');
    gEl.innerHTML = '';

    d.genres.forEach((g) => {
        const b = document.createElement('button');

        b.className = 'genre-btn';
        b.textContent = g.name;

        b.onclick = () => {
            b.classList.toggle('active');

            selectedGenres.has(g.id)
                ? selectedGenres.delete(g.id)
                : selectedGenres.add(g.id);
        };

        gEl.appendChild(b);
    });
}

/* ==================================================
   TRENDING
================================================== */
async function loadTrending(append = false) {
    if (!append) {
        currentTrendingPage = 1;
    } else {
        currentTrendingPage++;
    }

    const d = await fetchTMDB('/trending/movie/week', {
        language: 'pt-BR',
        page: currentTrendingPage
    });

    renderGrid(
        d.results,
        'trendingResults',
        append
    );
}

/* ==================================================
   BUSCAR FILMES
================================================== */
async function searchMovies(append = false) {
    const q = document.getElementById('query').value;

    if (!q) return;

    if (!append) {
        currentSearchPage = 1;
    } else {
        currentSearchPage++;
    }

    const d = await fetchTMDB('/search/movie', {
        language: 'pt-BR',
        query: q,
        page: currentSearchPage
    });

    renderGrid(
        d.results,
        'searchResults',
        append
    );

    document.getElementById(
        'loadMoreSearch'
    ).style.display =
        d.total_pages > currentSearchPage
            ? 'flex'
            : 'none';
}

/* ==================================================
   BUSCAR ATORES
================================================== */
async function searchActors(append = false) {
    const q =
        document.getElementById('actorQuery').value;

    if (!q) return;

    if (!append) {
        currentActorPage = 1;
    } else {
        currentActorPage++;
    }

    const d = await fetchTMDB('/search/person', {
        language: 'pt-BR',
        query: q,
        page: currentActorPage
    });

    const el =
        document.getElementById('actorResults');

    if (!append) el.innerHTML = '';

    d.results.forEach((p) => {
        const div = document.createElement('div');

        div.className = 'result-item';

        div.innerHTML = `
            <div class="rating-tag">
                <i class="fas fa-fire"></i>
                ${p.popularity.toFixed(0)}
            </div>

            <img src="${
                p.profile_path
                    ? IMG + p.profile_path
                    : 'img/404.png'
            }">

            <p>${p.name}</p>
        `;

        div.onclick = () =>
            showActorPortfolio(
                p.id,
                p.name,
                p.profile_path
            );

        el.appendChild(div);
    });

    document.getElementById(
        'loadMoreActors'
    ).style.display =
        d.total_pages > currentActorPage
            ? 'flex'
            : 'none';
}

/* ==================================================
   GRID PADRÃO
================================================== */
function renderGrid(
    movies,
    targetId,
    append
) {
    const el = document.getElementById(targetId);

    if (!append) el.innerHTML = '';

    movies.forEach((m) => {
        const div = document.createElement('div');

        div.className = 'result-item';

        div.innerHTML = `
            <div class="rating-tag">
                ★ ${m.vote_average.toFixed(1)}
            </div>

            <img src="${
                m.poster_path
                    ? IMG + m.poster_path
                    : 'img/404.png'
            }">

            <p>${m.title}</p>
        `;

        div.onclick = () => showMovie(m.id);

        el.appendChild(div);
    });
}

/* ==================================================
   SORTEAR
================================================== */
async function sortear() {
    const gf = [...selectedGenres].join(',');

    const d = await fetchTMDB(
        '/discover/movie',
        {
            language: 'pt-BR',
            with_genres: gf,
            page:
                Math.floor(
                    Math.random() * 5
                ) + 1,
            'vote_count.gte': 150
        }
    );

    if (d.results.length) {
        const randomMovie =
            d.results[
                Math.floor(
                    Math.random() *
                        d.results.length
                )
            ];

        showMovie(randomMovie.id);
    }
}

/* ==================================================
   FILME
================================================== */
async function showMovie(id) {
    const m = await fetchTMDB(
        `/movie/${id}`,
        {
            language: 'pt-BR',
            append_to_response:
                'watch/providers,similar,credits,videos'
        }
    );

    const card =
        document.getElementById('movieCard');

    card.style.display = 'block';

    document.getElementById(
        'movieTitle'
    ).textContent = m.title;

    document.getElementById(
        'movieRating'
    ).innerHTML =
        '<i class="fas fa-star" style="color:#fbbf24"></i> ' +
        m.vote_average.toFixed(1);

    document.getElementById(
        'movieYear'
    ).textContent = m.release_date
        ? m.release_date.slice(0, 4)
        : '-';

    document.getElementById(
        'movieOverview'
    ).textContent =
        m.overview ||
        'Sinopse indisponível.';

    document.getElementById(
        'posterWrap'
    ).innerHTML = `
        <img src="${
            m.poster_path
                ? IMG + m.poster_path
                : 'img/404.png'
        }">
    `;

    document.getElementById(
        'movieGenres'
    ).innerHTML = m.genres
        .map(
            (g) =>
                `<span class="meta-item genre-tag">${g.name}</span>`
        )
        .join('');

    document.getElementById(
        'tmdbLink'
    ).href =
        `https://www.themoviedb.org/movie/${id}`;

    const today = new Date();

    const relDate = m.release_date
        ? new Date(m.release_date)
        : null;

    /* Trailer */
    let videos = m.videos?.results || [];

    if (videos.length === 0) {
        const fallbackVideos =
            await fetchTMDB(
                `/movie/${id}/videos`,
                {}
            );

        videos =
            fallbackVideos.results || [];
    }

    const trailer =
        videos.find(
            (v) =>
                v.site === 'YouTube' &&
                v.type === 'Trailer'
        ) ||
        videos.find(
            (v) => v.site === 'YouTube'
        );

    const trailerDiv =
        document.getElementById(
            'trailerContainer'
        );

    if (trailer) {
        trailerDiv.style.display =
            'inline-flex';

        document.getElementById(
            'btnTrailer'
        ).onclick = () =>
            openTrailer(trailer.key);
    } else {
        trailerDiv.style.display = 'none';
    }

    /* restante do código segue igual */
}

/* ==================================================
   FECHAR FILME
================================================== */
function closeMovie() {
    document.getElementById(
        'movieCard'
    ).style.display = 'none';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/* ==================================================
   TRAILER
================================================== */
function openTrailer(key) {
    window.open(
        `https://www.youtube.com/watch?v=${key}`,
        '_blank'
    );
}

/* ==================================================
   WATCHLIST
================================================== */
function getWatchlist() {
    return JSON.parse(
        localStorage.getItem('watchlist') ||
            '[]'
    );
}

function saveWatchlist(list) {
    localStorage.setItem(
        'watchlist',
        JSON.stringify(list)
    );
}

/* ==================================================
   INIT
================================================== */
loadGenres();
loadTrending();
