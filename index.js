let pagina = 1;
let peliculasGeneradas = [];

window.onload = () => {
    const botonBuscar = document.getElementById("botonBuscar");
    const cerrarModal = document.getElementById("cerrarModal");
    const selectTipo = document.getElementById("tipo");
    const informe = document.getElementById("Ver-Informe");
    const inputBusqueda = document.getElementById("input");

    

    // Eventos
    informe.addEventListener("click", Informe); // Generar informe

    inputBusqueda.addEventListener("input", () => {
        // Búsqueda automática si se escriben más de 3 caracteres
        if (inputBusqueda.value.length > 3) {
            nuevaBusqueda();
        }
    });

    botonBuscar.addEventListener("click", nuevaBusqueda); // Botón de búsqueda

    cerrarModal.addEventListener("click", () => {
        // Cierra el modal de características
        document.getElementById("modal").classList.remove("mostrar");
    });

    selectTipo.addEventListener("change", () => {
        // Limpiar la lista y reiniciar búsqueda cuando se cambia el tipo
        const lista = document.getElementById("listaPeliculas");
        lista.innerText = "";
        pagina = 1;
        peliculasGeneradas = [];
        peticionOMDb(); // Hacer nueva petición
    });

    // Scroll infinito
    window.addEventListener("scroll", () => {
        if (!peticion && window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            peticionOMDb();
        }
    });
};

// Función para determinar el tipo de contenido (película o serie)
function type() {
    const tipo = document.getElementById("tipo").value;
    if (tipo === "Peliculas") {
        return "movie";
    } else if (tipo === "Series") {
        return "series";
    } else {
        return "";
    }
}

// Función para limpiar la pantalla y hacer nueva búsqueda
function nuevaBusqueda() {
    const lista = document.getElementById("listaPeliculas");
    lista.innerText = "";
    peliculasGeneradas = [];
    pagina = 1;
    peticionOMDb(); // Hacer nueva petición
}

// Generar informe con las películas mejor valoradas
function Informe() {
    if (peliculasGeneradas.length === 0) {
        console.log("No hay películas disponibles para generar un informe.");
        return;
    }

    // Almacenar películas mejor valoradas
    const peliculasOrdenadas = [...peliculasGeneradas]
        .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating)) // Ordenar por rating
        .slice(0, 5); // Obtener las 5 mejores

    const informeDiv = document.getElementById("informeDiv");
    const contenidoInforme = document.getElementById("contenidoInforme");

    contenidoInforme.innerHTML = ""; 

    const titulo = document.createElement("h3");
    titulo.textContent = "Top 5 Películas Mejor Valoradas:";
    contenidoInforme.appendChild(titulo);

    // Crear un contenedor para mostrar las películas
    const contenedorPeliculas = document.createElement("div");

    peliculasOrdenadas.forEach((pelicula) => {
        // Crear un contenedor para cada película
        const peliculaDiv = document.createElement("div");
        peliculaDiv.style.border = "2px solid white";

        // Título de la película
        const tituloPelicula = document.createElement("p");
        tituloPelicula.textContent = `Título: ${pelicula.Title}`;
        peliculaDiv.appendChild(tituloPelicula);

        // Año de la película
        const anioPelicula = document.createElement("p");
        anioPelicula.textContent = `Año: ${pelicula.Year}`;
        peliculaDiv.appendChild(anioPelicula);

        // Rating de la película
        const ratingPelicula = document.createElement("p");
        const rating = pelicula.imdbRating ? pelicula.imdbRating : "No disponible";
        ratingPelicula.textContent = `Rating: ${rating}`;
        peliculaDiv.appendChild(ratingPelicula);

        // Agregar la película al contenedor principal
        contenedorPeliculas.appendChild(peliculaDiv);
    });

    contenidoInforme.appendChild(contenedorPeliculas);

    // Crear div para mostrar el gráfico
    const chartDiv = document.createElement("div");
    chartDiv.setAttribute("id", "chart_div");
    contenidoInforme.appendChild(chartDiv);

    // Mostrar informe
    informeDiv.style.display = "block"; 
    // Llamada para generar el gráfico de Google Charts
    google.charts.load('current', {
        packages: ['corechart', 'bar']
    });
    google.charts.setOnLoadCallback(() => drawChart(peliculasOrdenadas));

    // Función para dibujar el gráfico de barras
    function drawChart(peliculas) {
        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Película');
        data.addColumn('number', 'Rating');

        // Llenar los datos del gráfico
        peliculas.forEach((pelicula) => {
            const rating = parseFloat(pelicula.imdbRating) || 0;
            data.addRow([pelicula.Title, rating]);
        });

        const options = {
            title: 'Top 5 Películas por Rating',
            chartArea: { width: '50%' },
            hAxis: {
                title: 'Rating',
                minValue: 0
            },
            vAxis: {
                title: 'Película'
            }
        };

        const chart = new google.visualization.BarChart(document.getElementById('chart_div'));
        chart.draw(data, options);
    }

    // Botón para cerrar el informe
    const cerrarButton = document.getElementById("cerrarInforme");
    cerrarButton.addEventListener("click", () => {
        informeDiv.style.display = "none"; // Ocultar el informe al hacer clic en cerrar
    });
}

// Función para hacer la petición a la API de OMDb
function peticionOMDb() {
    peticion = true;
    const resultados = document.getElementById("TotalResultados");
    const texto = document.getElementById("input").value;
    const tipo = type();
    const link = `https://www.omdbapi.com/?i=tt3896198&apikey=14e6ae78&s=${texto}&page=${pagina}&type=${tipo}`;

    document.getElementById("Cargando").classList.add("mostrar");

    fetch(link, { method: "GET" })
        .then((res) => res.json())
        .then((datosRecibidos) => {
            document.getElementById("Cargando").classList.remove("mostrar");
            pagina++;
            const lista = document.getElementById("listaPeliculas");
            resultados.innerText = `${datosRecibidos.totalResults} resultados`;

            if (datosRecibidos.Search) {
                datosRecibidos.Search.forEach((pelicula) => {
                    // Guardamos la película completa para su posterior uso
                    fetch(`https://www.omdbapi.com/?apikey=14e6ae78&i=${pelicula.imdbID}`, { method: "GET" })
                        .then((res) => res.json())
                        .then((datos) => {
                            peliculasGeneradas.push(datos);

                            const peliculaDiv = document.createElement("div");
                            peliculaDiv.className = "pelicula";

                            const poster = document.createElement("img");
                            poster.setAttribute("id", pelicula.imdbID);
                            poster.setAttribute("src", pelicula.Poster);

                            poster.addEventListener("error", (e) => {
                                e.target.src = "./default.png"; // Imagen por defecto en caso de error
                            });

                            poster.addEventListener("click", (e) => {
                                const id = e.target.id;
                                caracteristicas(id); // Mostrar características de la película
                            });

                            const titulo = document.createElement("p");
                            titulo.textContent = `${pelicula.Title} - ${pelicula.Year}`;

                            peliculaDiv.appendChild(poster);
                            peliculaDiv.appendChild(titulo);
                            lista.appendChild(peliculaDiv);
                        });
                });
            }
            peticion = false;
        })
        .catch((err) => {
            peticion = false;
            console.error("Error en la petición: ", err);
        });
}

// Función para mostrar las características de la película o serie seleccionada
function caracteristicas(imdbID) {
    const link = `https://www.omdbapi.com/?i=${imdbID}&apikey=14e6ae78`;
    document.getElementById("Cargando").classList.add("mostrar");

    fetch(link, { method: "GET" })
        .then((res) => res.json())
        .then((pelicula) => {
            document.getElementById("Cargando").classList.remove("mostrar");
            document.getElementById("Rating").textContent = pelicula.imdbRating;
            document.getElementById("tituloPelicula").textContent = pelicula.Title;
            document.getElementById("anioPelicula").textContent = pelicula.Year;
            document.getElementById("directorPelicula").textContent = pelicula.Director;
            document.getElementById("actoresPelicula").textContent = pelicula.Actors;
            document.getElementById("sinopsisPelicula").textContent = pelicula.Plot;

            const imagenPelicula = document.getElementById("imagenPelicula");
            imagenPelicula.setAttribute("src", pelicula.Poster);
            imagenPelicula.addEventListener("error", (e) => {
                e.target.src = "./default.png"; // Imagen por defecto si falla
            });

            document.getElementById("modal").classList.add("mostrar");
        })
        .catch((err) => {
            console.error("Error al obtener características: ", err);
        });
}
