const apiKey = '56e169c7b41a4ffe2a1d35f9e0d2296d';
const baseUrl = 'https://api.themoviedb.org/3';
let language = localStorage.getItem('selectedLanguage') || 'en-US';
let loadingMovies = false;
let currentCategory = localStorage.getItem('selectedCategory');
let randomMoviesVisible = false;
let totalSearchResults = 0;
let currentMovies = [];
let selectedLanguage = $('#languageToggle').val();
let previousCategoryMovies = [];

$(document).ready(function () {
    function updateHeader(categoryId, query, lang) {
    const selectedLanguage = lang || localStorage.getItem('selectedLanguage') || 'en-US';
    let headerText;

    if (query) {
        // Modify the headerText to include the search query
        headerText = `${selectedLanguage === 'ru-RU' ? 'Поиск' : selectedLanguage === 'uk-UA' ? 'Пошук' : 'Search'}: ${query}`;
    } else if (categoryId) {
        headerText = getGenreName(categoryId, selectedLanguage);
    } else {
        switch (selectedLanguage) {
            case 'ru-RU':
                headerText = 'Случайные фильмы';
                break;
            case 'uk-UA':
                headerText = 'Випадкові фільми';
                break;
            default:
                headerText = 'Random Movies';
        }
    }

    $('header h1').text(headerText);
}

    function getRandomMovies() {
        const moviesPerPage = 20;
        const totalPages = 24;
        const randomPage = Math.floor(Math.random() * totalPages) + 1;

        $('#randomMovies').empty();
		$('#moviesList').empty();

        $.ajax({
            url: `${baseUrl}/discover/movie`,
            data: {
                api_key: apiKey,
                language: selectedLanguage,
                sort_by: 'popularity.desc',
                page: randomPage
            },
            success: function (data) {
                previousCategoryMovies = currentMovies;
                currentMovies = data.results;

                // Append the new movies to the existing ones
                displayMovies(currentMovies.slice(0, moviesPerPage), '#randomMovies', true);

                randomMoviesVisible = true;
                updateHeader();
            },
            error: function (error) {
                console.error('Error fetching random movies:', error);
            }
        });
    }
	
	

    function clearMoviesContainer() {
        $('#moviesList').empty();
    }

    function switchToRandomMovies() {
        // Clear the container associated with the previous category
        clearMoviesContainer();

        // Display the movies from the previous category
        displayMovies(previousCategoryMovies, '#moviesList', false);
    }

    function getMoviesByGenre(genreId) {
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en-US';
    updateHeader(genreId, null);
    const moviesPerPage = 20;
    let currentPage = 1;
    let totalPages = 1;
    let loadingMoreMovies = false;

    hideRandomMovies();

    function fetchMovies(page) {
        return $.ajax({
            url: `${baseUrl}/discover/movie`,
            data: {
                api_key: apiKey,
                with_genres: genreId,
                language: selectedLanguage,
                page: page
            },
            success: function (data) {
                totalPages = data.total_pages;
                previousCategoryMovies = currentMovies;

                if (page === 1) {
                    currentMovies = data.results;
                } else {
                    currentMovies = currentMovies.concat(data.results);
                }

                // Append the new movies to the existing ones
                displayMovies(data.results, '#moviesList', loadingMoreMovies);
                loadingMoreMovies = false;
            },
            error: function (error) {
                console.error('Error fetching movies by genre:', error);
                loadingMovies = false;
            }
        });
    }

    function loadMoreMovies() {
        if (!loadingMoreMovies && currentPage < totalPages) {
            loadingMoreMovies = true;
            currentPage++;
            fetchMovies(currentPage);
        }
    }
	
    if (genreId !== 'random') {
        // Empty movies list if not in Random Movies
        $('#moviesList').empty();
    }

    fetchMovies(currentPage);

    // Добавлен обработчик события прокрутки для подгрузки дополнительных фильмов
    $(window).on('scroll', function () {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
            loadMoreMovies();
        }
    });
}

    function searchMovies(query) {
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en-US';
    let headerText;
    let searchLanguage;

    switch (selectedLanguage) {
        case 'ru-RU':
            headerText = 'Поиск';
            searchLanguage = 'ru-RU';
            break;
        case 'uk-UA':
            headerText = 'Пошук';
            searchLanguage = 'uk-UA';
            break;
        default:
            headerText = 'Search';
            searchLanguage = 'en-US';
    }

    updateHeader(null, query, selectedLanguage);

    let currentPage = 1;
    let loadingMoreMovies = false;

    function fetchMovies(page) {
        return $.ajax({
            url: `${baseUrl}/search/movie`,
            data: {
                api_key: apiKey,
                query: query,
                language: searchLanguage,
                page: page
            },
            success: function (data) {
                totalSearchResults = data.total_results;
                previousCategoryMovies = currentMovies;

                if (page === 1) {
                    currentMovies = data.results;
                } else {
                    currentMovies = currentMovies.concat(data.results);
                }

                // Append the new movies to the existing ones
                displayMovies(data.results, '#moviesList', loadingMoreMovies);
                loadingMoreMovies = false;
            },
            error: function (error) {
                console.error('Error fetching search movies:', error);
            }
        });
    }

    currentMovies = [];
    fetchMovies(currentPage);

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set('query', query);
    window.history.replaceState({}, '', `${window.location.pathname}?${queryParams}`);
}


    $('#searchInput').on('keypress', function (event) {
        if (event.which === 13) { // 13 - код клавиши "Enter"
            event.preventDefault();
            const query = $(this).val().trim();
            searchMovies(query);
            hideRandomMovies();
        }
    });

    $('#searchForm').on('submit', function (event) {
        event.preventDefault(); // Предотвратить стандартное поведение отправки формы

        const query = $('#searchInput').val().trim();

        // Проверить, была ли нажата клавиша Enter и является ли запрос непустым перед вызовом функции searchMovies
        if (event.originalEvent.submitter && event.originalEvent.submitter.type === 'submit' && query !== '') {
            searchMovies(query);
            hideRandomMovies();
        }
    });

    function hideRandomMovies() {
        $('#randomMovies').empty();
        randomMoviesVisible = false;
    }

    function displayMovies(movies, containerId, append) {
        const container = $(containerId);

        // Clear the existing movies list if it's not a search result
        if (!append) {
            container.empty();
        }

        movies.forEach(function (movie) {
            if (!movie.poster_path) {
                return;
            }

            const movieBlock = $('<div>').addClass('movie-block').data('movie-id', movie.id);
            const posterPath = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
            const poster = $('<img>').attr('src', posterPath).attr('alt', movie.title);
            const title = $('<div>').addClass('movie-title').text(movie.title);

            movieBlock.append(poster, title);

            movieBlock.on('click', function () {
                showMovieModal(movie.id);
            });

            container.append(movieBlock);
        });
    }

    const showMovieModal = function (movieId) {
    localStorage.setItem('selectedLanguage', selectedLanguage);
	
	sidebarOpen = false;
    toggleSidebar();

    $.get(`${baseUrl}/movie/${movieId}`, {
        api_key: apiKey,
        language: language
    })
    .done(function (movie) {
        $.get(`${baseUrl}/movie/${movieId}/videos`, {
            api_key: apiKey,
            language: language
        })
        .done(function (data) {
            const modal = $('#movieModal');
            modal.empty();

            const closeButton = $('<span>').addClass('close-modal').html('&times;');
            closeButton.on('click', function () {
                hideModal();
            });

            const modalContent = $('<div>').addClass('modal-content');
            const title = $('<h2>').attr('id', 'movie-title').text(movie.title);

            const starRating = calculateStarRating(movie.vote_average);
            const starsRating = $('<div>').addClass('stars-rating').html(starRating);

            const rating = $('<p>').text(`Rating: ${movie.vote_average}`);
            const overview = $('<p>').text(movie.overview);

            const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://via.placeholder.com/300x450';
            const poster = $('<img>').addClass('poster-image').attr('src', posterPath).attr('alt', movie.title);

            const actorsList = $('<ul>').addClass('actors-list');
            $.get(`${baseUrl}/movie/${movieId}/credits`, {
                api_key: apiKey,
                language: language
            })
            .done(function (credits) {
                const actors = credits.cast.slice(0, 5);
                actors.forEach(function (actor) {
                    const actorItem = $('<li>').text(actor.name);
                    actorsList.append(actorItem);
                });
            })
            .fail(function (error) {
                console.error('Error fetching credits:', error);
            });

            const posterContainer = $('<div>').addClass('poster-container');
            posterContainer.append(poster);

            const trailerContainer = $('<div>').addClass('trailer-container');
            if (data.results.length > 0) {
                const trailerKey = data.results[0].key;
                const trailerIframe = $('<iframe>').attr('src', `https://www.youtube.com/embed/${trailerKey}`).attr('allowfullscreen', true);
                trailerContainer.append(trailerIframe);
            } else {
                console.error('No trailers found for this movie.');
            }

            modalContent.append(closeButton, title, starsRating, rating, overview, posterContainer, actorsList, trailerContainer);
            modal.append(modalContent).show();

            // Добавляем обработчик события для закрытия модального окна при клике за его пределами
            $(document).on('mouseup', function (event) {
                if (!modalContent.is(event.target) && modalContent.has(event.target).length === 0) {
                    hideModal();
                }
            });

            // Добавляем класс для блокировки прокрутки страницы
            $('body').addClass('modal-open');
        })
        .fail(function (error) {
            console.error('Error fetching movie trailers:', error);
        });
    })
    .fail(function (error) {
        console.error('Error fetching movie details:', error);
    });
};

const hideModal = function () {
    const modal = $('#movieModal');
    const trailerContainer = modal.find('.trailer-container');

    // Остановка воспроизведения трейлера
    trailerContainer.empty();

    modal.hide();

    // Удаляем класс для разблокировки прокрутки страницы
    $('body').removeClass('modal-open');
};

    function calculateStarRating(voteAverage) {
        const totalStars = 5;
        const maxRating = 10;

        const normalizedRating = (voteAverage / maxRating) * totalStars;

        const fullStars = Math.floor(normalizedRating);
        const hasHalfStar = normalizedRating % 1 !== 0;

        let starHtml = '';

        for (let i = 1; i <= totalStars; i++) {
            if (i <= fullStars) {
                starHtml += '<i class="fas fa-star"></i>';
            } else if (hasHalfStar && i === Math.ceil(normalizedRating)) {
                starHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starHtml += '<i class="far fa-star"></i>';
            }
        }

        return starHtml;
    }

    function updateUnknownGenreButtonLabel(language) {
        const button = $('#unknownGenreButton');
        let buttonText;

        switch (language) {
            case 'ru-RU':
                buttonText = 'Случайные фильмы';
                break;
            case 'uk-UA':
                buttonText = 'Випадкові фільми';
                break;
            default:
                buttonText = 'Random Movies';
        }

        // Change the element type to 'button' and add the 'random-genre' class
        button.replaceWith(`<button class="random-genre" id="unknownGenreButton">${buttonText}</button>`);

        // Add click event handler to the button
        $('#unknownGenreButton').on('click', function () {
            localStorage.setItem('selectedCategory', 'random');
            currentCategory = 'random';
			const modal = $('#movieModal');
            modal.empty();
            getRandomMovies();
        });
    }

    function changeLanguage(selectedLanguage) {
    language = selectedLanguage;
    localStorage.setItem('selectedLanguage', selectedLanguage);

    // Save the current category before changing the language
    const savedCategory = localStorage.getItem('selectedCategory');

    updateHeader(savedCategory, null, selectedLanguage);

    $('.genre-icon').each(function () {
        const genreId = $(this).data('genre-id');
        const genreName = getGenreName(genreId);
        $(this).text(genreName);
    });

    // If the saved category is 'random', fetch random movies, otherwise fetch movies by genre
    if (savedCategory === 'random') {
        getRandomMovies();
    } else {
        getMoviesByGenre(savedCategory);
    }

    // Update the URL to include the selected language
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set('lang', selectedLanguage);
    window.history.replaceState({}, '', `${window.location.pathname}?${queryParams}`);

    // Move languageToggle to the top based on the selected language
    moveLanguageToggleToTop(selectedLanguage);
}

    function getGenreName(genreId, lang) {
        const translations = {
            28: {
                'en-US': 'Action',
                'ru-RU': 'Боевик',
                'uk-UA': 'Бойовик'
            },
            35: {
                'en-US': 'Comedy',
                'ru-RU': 'Комедия',
                'uk-UA': 'Комедія'
            },
            18: {
                'en-US': 'Drama',
                'ru-RU': 'Драма',
                'uk-UA': 'Драма'
            },
            12: {
                'en-US': 'Adventure',
                'ru-RU': 'Приключения',
                'uk-UA': 'Пригоди'
            },
            16: {
                'en-US':            'Animation',
            'ru-RU': 'Мультфильм',
            'uk-UA': 'Мультфільм'
        },
        80: {
            'en-US': 'Crime',
            'ru-RU': 'Криминал',
            'uk-UA': 'Кримінал'
        },
        99: {
            'en-US': 'Documentary',
            'ru-RU': 'Документальный',
            'uk-UA': 'Документальний'
        },
        10751: {
            'en-US': 'Family',
            'ru-RU': 'Семейный',
            'uk-UA': 'Сімейний'
        },
        14: {
            'en-US': 'Fantasy',
            'ru-RU': 'Фэнтези',
            'uk-UA': 'Фентезі'
        },
        36: {
            'en-US': 'History',
            'ru-RU': 'Исторический',
            'uk-UA': 'Історичний'
        },
        27: {
            'en-US': 'Horror',
            'ru-RU': 'Ужасы',
            'uk-UA': 'Жахи'
        },
        10402: {
            'en-US': 'Music',
            'ru-RU': 'Музыкальный',
            'uk-UA': 'Музичний'
        },
        9648: {
            'en-US': 'Mystery',
            'ru-RU': 'Тайна',
            'uk-UA': 'Таємниця'
        },
        10749: {
            'en-US': 'Romance',
            'ru-RU': 'Романтика',
            'uk-UA': 'Романтика'
        },
        878: {
            'en-US': 'Science Fiction',
            'ru-RU': 'Научная фантастика',
            'uk-UA': 'Наукова фантастика'
        },
        10770: {
            'en-US': 'TV Movie',
            'ru-RU': 'ТВ-фильм',
            'uk-UA': 'ТБ-фільм'
        },
        53: {
            'en-US': 'Thriller',
            'ru-RU': 'Триллер',
            'uk-UA': 'Трилер'
        },
        10752: {
            'en-US': 'War',
            'ru-RU': 'Военный',
            'uk-UA': 'Воєнний'
        },
        37: {
            'en-US': 'Western',
            'ru-RU': 'Вестерн',
            'uk-UA': 'Вестерн'
        },
        // Add other genres if needed
    };

    return translations[genreId] ? translations[genreId][lang || language] : 'Unknown Genre';
}

let sidebarOpen = false;

    function toggleSidebar() {
        const sidebar = $('.sidebar');
        sidebar.toggleClass('sidebar-open', sidebarOpen);
        // Update the button text/icon based on sidebar state
        $('.menu-toggle').html(sidebarOpen ? '&#9776;' : '&#9776;');
    }

    // Initially close the sidebar
    toggleSidebar();

function loadSavedData() {
    const savedCategory = localStorage.getItem('selectedCategory');
    const savedLanguage = localStorage.getItem('selectedLanguage');

    if (savedCategory) {
        currentCategory = savedCategory;
        if (currentCategory === 'random') {
            getRandomMovies();
        } else {
            // If a category other than 'random' is saved, fetch movies by genre
            getMoviesByGenre(savedCategory);
        }
    } else {
        getRandomMovies();
    }

    if (savedLanguage) {
        changeLanguage(savedLanguage);
        updateUnknownGenreButtonLabel(savedLanguage);
    }

    // Restore search parameters if available
    const searchParamsJson = localStorage.getItem('searchParams');
    if (searchParamsJson) {
        const searchParams = JSON.parse(searchParamsJson);
        searchMovies(searchParams.query);
    }
}

// Function to move languageToggle to the top based on the selected language
function moveLanguageToggleToTop(selectedLanguage) {
    const languageToggle = $('#languageToggle');
    const selectedOption = languageToggle.find(`option[value="${selectedLanguage}"]`);
    const selectedText = selectedOption.text();

    // Set the text and value of the selected option to the currently selected language
    selectedOption.text(languageToggle.find(':selected').text());
    selectedOption.val(languageToggle.find(':selected').val());

    // Set the text and value of the currently selected option to the previously selected language
    languageToggle.find(':selected').text(selectedText);
    languageToggle.find(':selected').val(selectedLanguage);
}


const queryParams = new URLSearchParams(window.location.search);
queryParams.set('lang', selectedLanguage);
window.history.replaceState({}, '', `${window.location.pathname}?${queryParams}`);

$('.genre-icon').on('click', function () {
    const genreId = $(this).data('genre-id');
    localStorage.setItem('selectedCategory', genreId);
    currentCategory = genreId;
    getMoviesByGenre(genreId);
});

$('.menu-toggle').on('click', function () {
        sidebarOpen = !sidebarOpen;
        toggleSidebar();
    });

$('#languageToggle').on('change', function () {
    const selectedLanguage = $(this).val();
    localStorage.setItem('selectedLanguage', selectedLanguage);
    changeLanguage(selectedLanguage);
    updateUnknownGenreButtonLabel(selectedLanguage);
});

$('#randomMoviesButton').on('click', function () {
    switchToRandomMovies();
});

loadSavedData();
});