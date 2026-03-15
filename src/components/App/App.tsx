import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import ReactPaginate from "react-paginate";

import SearchBar from "../SearchBar/SearchBar";
import MovieGrid from "../MovieGrid/MovieGrid";
import Loader from "../Loader/Loader";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import MovieModal from "../MovieModal/MovieModal";

import type { Movie } from "../../types/movie";
import { fetchMovies } from "../../services/movieService";

type MoviesResponse = {
  results: Movie[];
  total_pages: number;
  // add other fields if needed
};

import css from "./App.module.css";

export default function App() {
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const { data, isLoading, isError } = useQuery<MoviesResponse>({
    queryKey: ["movies", query, page],
    queryFn: async () => {
      const response = await fetchMovies({ query, page }) as MoviesResponse | Movie[];
      // If fetchMovies returns an array, wrap it in an object
      if (Array.isArray(response)) {
        return {
          results: response,
          total_pages: 1,
        };
      }
      // Otherwise, assume it returns the correct shape
      return {
        results: (response as MoviesResponse).results ?? [],
        total_pages: (response as MoviesResponse).total_pages ?? 0,
        // add other fields if needed
      };
    },
    enabled: query !== "",
    placeholderData: keepPreviousData, // не очищає попередню сторінку під час запиту
  });

  const movies = data?.results ?? [];
  const totalPages = Math.min(data?.total_pages ?? 0, 500); // обмеження TMDB

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
  };

  const openModal = (movie: Movie) => setSelectedMovie(movie);

  const closeModal = () => { setSelectedMovie(null); };

  useEffect(() => {
    if (query && movies.length === 0 && !isLoading && !isError) {
      toast("No movies found for your request.");
    }
  }, [movies, query, isLoading, isError]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  return (
    <>
      <Toaster position="top-right" />

      <SearchBar onSubmit={handleSearch} />

      {isLoading && <Loader />}

      {isError && <ErrorMessage />}

      {!isLoading && !isError && movies.length > 0 && (
        <>
          <MovieGrid movies={movies} onSelect={openModal} />

          {totalPages > 1 && (
            <ReactPaginate
              pageCount={totalPages}
              pageRangeDisplayed={5}
              marginPagesDisplayed={1}
              onPageChange={({ selected }) => setPage(selected + 1)}
              forcePage={page - 1}
              containerClassName={css.pagination}
              activeClassName={css.active}
              nextLabel=">"
              previousLabel="<"
            />
          )}
        </>
      )}

      {selectedMovie && (<MovieModal movie={selectedMovie} onClose={closeModal} />)}
    </>
  );
}
