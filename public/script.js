document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultsSection = document.getElementById('results');
    const resultsTitle = document.getElementById('resultsTitle');
    const repoList = document.getElementById('repoList');
    const pagination = document.getElementById('pagination');
    const sampleRepos = document.getElementById('sampleRepos');
    
    let currentPage = 1;
    let currentKeyword = '';
    let totalPages = 1;
    
    // Check if there's a saved search in localStorage
    const savedSearch = localStorage.getItem('githubSearch');
    if (savedSearch) {
        const searchData = JSON.parse(savedSearch);
        currentKeyword = searchData.keyword;
        currentPage = searchData.page || 1;
        searchInput.value = currentKeyword;
        
        // Hide the search form and sample repos if we have a saved search
        searchForm.style.display = 'none';
        sampleRepos.style.display = 'none';
        
        // Show a small search bar at the top instead
        createMiniSearchBar();
        
        searchRepositories(currentKeyword, currentPage);
    }
    
    // Handle search form submission
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    function performSearch() {
        currentKeyword = searchInput.value.trim();
        if (currentKeyword) {
            currentPage = 1;
            // Save search to localStorage
            localStorage.setItem('githubSearch', JSON.stringify({
                keyword: currentKeyword,
                page: currentPage
            }));
            
            // Hide the main search form and sample repos
            searchForm.style.display = 'none';
            sampleRepos.style.display = 'none';
            
            // Create mini search bar
            createMiniSearchBar();
            
            searchRepositories(currentKeyword, currentPage);
        }
    }
    
    function createMiniSearchBar() {
        // Remove existing mini search bar if it exists
        const existingMiniSearch = document.getElementById('miniSearchBar');
        if (existingMiniSearch) {
            existingMiniSearch.remove();
        }
        
        // Create mini search bar
        const miniSearchBar = document.createElement('div');
        miniSearchBar.id = 'miniSearchBar';
        miniSearchBar.style.marginBottom = '20px';
        miniSearchBar.style.display = 'flex';
        miniSearchBar.style.justifyContent = 'center';
        
        const miniSearchInput = document.createElement('input');
        miniSearchInput.type = 'text';
        miniSearchInput.placeholder = 'Search for different repositories...';
        miniSearchInput.value = currentKeyword;
        miniSearchInput.style.padding = '8px';
        miniSearchInput.style.border = '1px solid #ddd';
        miniSearchInput.style.borderRadius = '4px 0 0 4px';
        miniSearchInput.style.width = '300px';
        
        const miniSearchButton = document.createElement('button');
        miniSearchButton.textContent = 'Search';
        miniSearchButton.style.padding = '8px 16px';
        miniSearchButton.style.backgroundColor = '#0366d6';
        miniSearchButton.style.color = 'white';
        miniSearchButton.style.border = 'none';
        miniSearchButton.style.borderRadius = '0 4px 4px 0';
        miniSearchButton.style.cursor = 'pointer';
        
        miniSearchButton.addEventListener('click', function() {
            currentKeyword = miniSearchInput.value.trim();
            if (currentKeyword) {
                currentPage = 1;
                localStorage.setItem('githubSearch', JSON.stringify({
                    keyword: currentKeyword,
                    page: currentPage
                }));
                searchRepositories(currentKeyword, currentPage);
            }
        });
        
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear';
        clearButton.style.padding = '8px 16px';
        clearButton.style.backgroundColor = '#dc3545';
        clearButton.style.color = 'white';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '4px';
        clearButton.style.cursor = 'pointer';
        clearButton.style.marginLeft = '10px';
        
        clearButton.addEventListener('click', function() {
            localStorage.removeItem('githubSearch');
            searchForm.style.display = 'block';
            searchInput.value = '';
            resultsSection.style.display = 'none';
            sampleRepos.style.display = 'block';
            currentKeyword = '';
            miniSearchBar.remove();
        });
        
        miniSearchBar.appendChild(miniSearchInput);
        miniSearchBar.appendChild(miniSearchButton);
        miniSearchBar.appendChild(clearButton);
        
        // Insert after header
        document.querySelector('.header').after(miniSearchBar);
    }
    
    // Function to search repositories
    function searchRepositories(keyword, page) {
        repoList.innerHTML = '<div class="loading">Searching repositories...</div>';
        resultsSection.style.display = 'block';
        resultsTitle.textContent = `Search Results for "${keyword}"`;
        
        fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword, page }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Search failed');
            }
            return response.json();
        })
        .then(data => {
            displayRepositories(data.items);
            setupPagination(data.total_count, page);
        })
        .catch(error => {
            console.error('Error:', error);
            // If API fails, show sample repositories instead of error message
            sampleRepos.style.display = 'block';
            resultsSection.style.display = 'none';
        });
    }
    
    // Function to display repositories
    function displayRepositories(repos) {
        if (!repos || repos.length === 0) {
            // If no results, show sample repositories
            sampleRepos.style.display = 'block';
            resultsSection.style.display = 'none';
            return;
        }
        
        repoList.innerHTML = '';
        repos.forEach(repo => {
            const repoCard = document.createElement('div');
            repoCard.className = 'repo-card';
            repoCard.innerHTML = `
                <h3>
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
                        ${repo.full_name}
                    </a>
                </h3>
                <p>${repo.description || 'No description available'}</p>
                <div class="repo-meta">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    <span>📝 ${repo.language || 'N/A'}</span>
                    <span>👀 ${repo.watchers_count}</span>
                    <span>📅 ${new Date(repo.created_at).toLocaleDateString()}</span>
                </div>
            `;
            repoList.appendChild(repoCard);
        });
    }
    
    // Function to setup pagination
    function setupPagination(totalCount, currentPage) {
        const perPage = 30;
        totalPages = Math.ceil(totalCount / perPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        pagination.innerHTML = `
            <button id="prevBtn" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentPage} of ${totalPages} (${totalCount} total results)</span>
            <button id="nextBtn" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
        `;
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                // Update saved page in localStorage
                localStorage.setItem('githubSearch', JSON.stringify({
                    keyword: currentKeyword,
                    page: currentPage
                }));
                searchRepositories(currentKeyword, currentPage);
            }
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                // Update saved page in localStorage
                localStorage.setItem('githubSearch', JSON.stringify({
                    keyword: currentKeyword,
                    page: currentPage
                }));
                searchRepositories(currentKeyword, currentPage);
            }
        });
    }
});