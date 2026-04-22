const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYjIxNTRkMGQ1N2QwNjQ5N2NlOGRkOWVkZTRkYzZiYiIsIm5iZiI6MTc3NjY4NjI2Ny45NDIwMDAyLCJzdWIiOiI2OWU2MTRiYjQ1OGFjYzdjZmU1MjBjOTYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.DxSJCdCH6Siam-pgPu3IUkOO4erz7jtSIcT2nqp7Vl0';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const LOGO = 'https://image.tmdb.org/t/p/original';
let selectedGenres = new Set();
let currentTrendingPage = 1;
let currentSearchPage = 1;
let currentActorPage = 1;

function enableDragScroll(el) {
    let isDown = false; let startX; let scrollLeft;
    el.addEventListener('mousedown', (e) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing'; });
    el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = 'grab'; });
    el.addEventListener('mouseup', () => { isDown = false; el.style.cursor = 'grab'; });
    el.addEventListener('mousemove', (e) => { if(!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; const walk = (x - startX) * 2; el.scrollLeft = scrollLeft - walk; });
    el.addEventListener('touchstart', (e) => { startX = e.touches[0].pageX - el.offsetLeft; scrollLeft = el.scrollLeft; }, {passive: true});
    el.addEventListener('touchmove', (e) => { const x = e.touches[0].pageX - el.offsetLeft; const walk = (x - startX) * 1.5; el.scrollLeft = scrollLeft - walk; }, {passive: true});
}

async function fetchTMDB(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    return r.json();
}

function switchTab(t) {
    document.querySelectorAll('.panel, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(t + 'Panel').classList.add('active');
    document.getElementById('btn-' + t).classList.add('active');
    if(t === 'trending' && currentTrendingPage === 1) loadTrending();
}

async function loadGenres() {
    const d = await fetchTMDB('/genre/movie/list', { language: 'pt-BR' });
    const gEl = document.getElementById('genres');
    gEl.innerHTML = '';
    d.genres.forEach(g => {
        const b = document.createElement('button');
        b.className = 'genre-btn';
        b.textContent = g.name;
        b.onclick = () => {
            b.classList.toggle('active');
            selectedGenres.has(g.id) ? selectedGenres.delete(g.id) : selectedGenres.add(g.id);
        };
        gEl.appendChild(b);
    });
}

async function loadTrending(append = false) {
    if(!append) currentTrendingPage = 1;
    else currentTrendingPage++;
    const d = await fetchTMDB('/trending/movie/week', { language: 'pt-BR', page: currentTrendingPage });
    renderGrid(d.results, 'trendingResults', append);
}

async function searchMovies(append = false) {
    const q = document.getElementById('query').value;
    if(!q) return;
    if(!append) currentSearchPage = 1;
    else currentSearchPage++;
    const d = await fetchTMDB('/search/movie', { language: 'pt-BR', query: q, page: currentSearchPage });
    renderGrid(d.results, 'searchResults', append);
    document.getElementById('loadMoreSearch').style.display = d.total_pages > currentSearchPage ? 'flex' : 'none';
}

async function searchActors(append = false) {
    const q = document.getElementById('actorQuery').value;
    if(!q) return;
    if(!append) currentActorPage = 1;
    else currentActorPage++;
    const d = await fetchTMDB('/search/person', { language: 'pt-BR', query: q, page: currentActorPage });
    
    const el = document.getElementById('actorResults');
    if(!append) el.innerHTML = '';
    d.results.forEach(p => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `<div class="rating-tag"><i class="fas fa-fire"></i> ${p.popularity.toFixed(0)}</div><img src="${p.profile_path ? IMG + p.profile_path : 'img/404.png'}"><p>${p.name}</p>`;
        div.onclick = () => showActorPortfolio(p.id, p.name, p.profile_path);
        el.appendChild(div);
    });
    document.getElementById('loadMoreActors').style.display = d.total_pages > currentActorPage ? 'flex' : 'none';
}

function renderGrid(movies, targetId, append) {
    const el = document.getElementById(targetId);
    if(!append) el.innerHTML = '';
    movies.forEach(m => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `<div class="rating-tag">★ ${m.vote_average.toFixed(1)}</div><img src="${m.poster_path ? IMG + m.poster_path : 'img/404.png'}"><p>${m.title}</p>`;
        div.onclick = () => showMovie(m.id);
        el.appendChild(div);
    });
}

async function sortear() {
    const gf = [...selectedGenres].join(',');
    const d = await fetchTMDB('/discover/movie', { language: 'pt-BR', with_genres: gf, page: Math.floor(Math.random() * 5) + 1, 'vote_count.gte': 150 });
    if(d.results.length) showMovie(d.results[Math.floor(Math.random() * d.results.length)].id);
}

async function showMovie(id) {
    // Adicionado "videos" no append_to_response
    const m = await fetchTMDB(`/movie/${id}`, { language: 'pt-BR', append_to_response: 'watch/providers,similar,credits,videos' });
    const card = document.getElementById('movieCard');
    card.style.display = 'block';
    
    document.getElementById('movieTitle').textContent = m.title;
    document.getElementById('movieRating').innerHTML = '<i class="fas fa-star" style="color:#fbbf24"></i> ' + m.vote_average.toFixed(1);
    document.getElementById('movieYear').textContent = m.release_date ? m.release_date.slice(0,4) : '-';
    document.getElementById('movieOverview').textContent = m.overview || 'Sinopse indisponível.';
    document.getElementById('posterWrap').innerHTML = `<img src="${m.poster_path ? IMG + m.poster_path : 'img/404.png'}">`;
    document.getElementById('movieGenres').innerHTML = m.genres.map(g => `<span class="meta-item genre-tag">${g.name}</span>`).join('');
    document.getElementById('tmdbLink').href = `https://www.themoviedb.org/movie/${id}`;
    
    const statusEl = document.getElementById('movieStatus');
    const today = new Date();
    const relDate = m.release_date ? new Date(m.release_date) : null;
    
    if (m.status === 'In Production' || m.status === 'Planned') {
        statusEl.innerHTML = `<div class="status-badge future"><i class="fas fa-calendar-alt"></i> Em Produção</div>`;
    } else if (relDate && relDate > today) {
        const formattedDate = relDate.toLocaleDateString('pt-BR');
        statusEl.innerHTML = `<div class="status-badge future"><i class="fas fa-clock"></i> Estreia em ${formattedDate}</div>`;
    } else if (m.status === 'Released' && relDate && (today - relDate) < (45 * 24 * 60 * 60 * 1000)) {
        statusEl.innerHTML = `<div class="status-badge cinema"><i class="fas fa-ticket-alt"></i> Em Exibição nos Cinemas</div>`;
    } else {
        statusEl.innerHTML = '';
    }

    // --- LÓGICA DO TRAILER COM FALLBACK PARA INGLÊS ---
    let videos = m.videos?.results || [];
    
    // Se o TMDB não tiver vídeos cadastrados em pt-BR, busca na linguagem original
    if (videos.length === 0) {
        const fallbackVideos = await fetchTMDB(`/movie/${id}/videos`, {});
        videos = fallbackVideos.results || [];
    }
    
    // Pega o primeiro trailer do YouTube (ou qualquer vídeo do YT se não achar trailer)
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos.find(v => v.site === 'YouTube');
    const trailerDiv = document.getElementById('trailerContainer');
    
    if (trailer) {
        trailerDiv.style.display = 'block';
        document.getElementById('btnTrailer').onclick = () => openTrailer(trailer.key);
    } else {
        trailerDiv.style.display = 'none';
    }
    // --------------------------------------------------

    const castEl = document.getElementById('movieCast');
    castEl.innerHTML = '';
    const cast = m.credits?.cast || [];
    document.getElementById('castSection').style.display = cast.length ? 'block' : 'none';
    cast.slice(0, 15).forEach(person => {
        const div = document.createElement('div');
        div.className = 'cast-item';
        div.innerHTML = `<img src="${person.profile_path ? IMG + person.profile_path : 'img/404.png'}"><span class="cast-name">${person.name}</span><span class="cast-role">${person.character}</span>`;
        div.onclick = () => showActorPortfolio(person.id, person.name, person.profile_path);
        castEl.appendChild(div);
    });
    enableDragScroll(castEl);

    const wp = document.getElementById('watchProviders');
    wp.innerHTML = '';
    const br = m['watch/providers']?.results?.BR || {};
    const link = br.link || `https://www.themoviedb.org/movie/${id}/watch?locale=BR`;
    const providers = [...(br.flatrate || []), ...(br.rent || []), ...(br.buy || [])];
    const uniquePr = Array.from(new Set(providers.map(p => p.provider_id))).map(id => providers.find(p => p.provider_id === id));
    
    if (uniquePr.length > 0) {
        uniquePr.forEach(p => {
            const a = document.createElement('a');
            a.className = 'provider';
            a.href = link;
            a.target = '_blank';
            a.innerHTML = `<img src="${LOGO + p.logo_path}"><span class="provider-name">${p.provider_name}</span>`;
            wp.appendChild(a);
        });
    } else {
        wp.innerHTML = `<div class="no-providers"><i class="fas fa-info-circle"></i> Não disponível em streaming no Brasil no momento.</div>`;
    }

    const sm = document.getElementById('similarMovies');
    sm.innerHTML = '';
    const similar = m.similar?.results || [];
    document.getElementById('similarSection').style.display = similar.length ? 'block' : 'none';
    similar.slice(0, 6).forEach(s => {
        const div = document.createElement('div');
        div.className = 'similar-item';
        div.innerHTML = `<img src="${s.poster_path ? IMG + s.poster_path : 'img/404.png'}"><p>${s.title}</p>`;
        div.onclick = (e) => { e.stopPropagation(); showMovie(s.id); };
        sm.appendChild(div);
    });
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeMovie() {
    document.getElementById('movieCard').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- FUNÇÕES NOVAS DO TRAILER ----
function openTrailer(key) {
    window.open(`https://www.youtube.com/watch?v=${key}`, '_blank');
}

function closeTrailer() {
    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    iframe.src = ''; // Limpa o iframe para parar o som do vídeo
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}
// ----------------------------------

async function showActorPortfolio(id, name, pic) {
    const data = await fetchTMDB(`/person/${id}/movie_credits`, { language: 'pt-BR' });
    const details = await fetchTMDB(`/person/${id}`, { language: 'pt-BR' });
    const modal = document.getElementById('portfolioModal');
    
    document.getElementById('actorInfo').innerHTML = `
        <img src="${pic ? IMG + pic : 'img/404.png'}">
        <div class="actor-title">
            <h2>${name}</h2>
            <div class="meta" style="margin-bottom:0">
                <span class="meta-item"><i class="fas fa-fire" style="color:#ef4444"></i> Popularidade: ${details.popularity.toFixed(0)}</span>
            </div>
            <div class="actor-bio">${details.biography || 'Biografia não disponível em português.'}</div>
        </div>`;
    
    const grid = document.getElementById('portfolioGrid');
    grid.innerHTML = '';
    data.cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12).forEach(role => {
        const div = document.createElement('div');
        div.className = 'portfolio-item';
        div.innerHTML = `<img src="${role.poster_path ? IMG + role.poster_path : 'img/404.png'}"><p>${role.title}</p>`;
        div.onclick = () => { closePortfolio(); showMovie(role.id); };
        grid.appendChild(div);
    });
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePortfolio() {
    document.getElementById('portfolioModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Adicionado o fechamento do trailer ao clicar fora
window.onclick = (event) => {
    if (event.target == document.getElementById('portfolioModal')) closePortfolio();
    if (event.target == document.getElementById('trailerModal')) closeTrailer();
}

loadGenres();
loadTrending();
