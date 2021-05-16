require('dotenv').config()

const axios = require('axios')
const { db } = require('./firebase')
const theatersData = require('./data/theaters.json')
const customersData = require('./data/customers.json')

const API_KEY = '9a6583e9565c76d0dea9ec534c5b1808'
const BASE_URL = 'https://api.themoviedb.org/3'

const theatersRef = db.collection('theaters')
const customersRef = db.collection('customers')
const moviesRef = db.collection('movies')
const ticketsRef = db.collection('tickets')

function getRandomIndex(array) {
  return Math.floor(Math.random() * array.length)
}

// Add movies with to firestore
function addMovies() {
  moviesRef.get().then((querySnapshot) => {
    if (!querySnapshot.size) {
      axios
        .get(`${BASE_URL}/movie/popular?api_key=${API_KEY}`)
        .then((response) => {
          response.data.results
            .map((movie) => {
              return {
                title: movie.title,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
              }
            })
            .forEach((data) => {
              moviesRef
                .add({
                  title: data.title,
                  releaseDate: data.releaseDate,
                  rating: data.rating,
                })
                .then((docRef) => {
                  console.log('Movie added with ID: ', docRef.id)
                })
            })
        })
    }
  })
}

// Add customers to firestore
function addCustomers() {
  customersRef.get().then((querySnapshot) => {
    !querySnapshot.size &&
      customersData.forEach((data) => {
        customersRef.add(data).then((docRef) => {
          console.log('Customer added with ID: ', docRef.id)
        })
      })
  })
}

// Add theaters to firestore
function addTheaters() {
  theatersRef.get().then((querySnapshot) => {
    !querySnapshot.size &&
      theatersData.forEach((data) => {
        theatersRef.add(data).then((docRef) => {
          console.log('Theater added with ID: ', docRef.id)
        })
      })
  })
}

// Add tickets to firestore
function addTickets() {
  const customersId = []

  customersRef
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((customerDoc) => {
        customersId.push(customerDoc.id)
      })
      return theatersRef.get()
    })
    .then((querySnapshot) => {
      const takenSeatsByTheater = []

      querySnapshot.forEach((theaterDoc) => {
        takenSeatsByTheater.push({
          theaterId: theaterDoc.id,
          seats: theaterDoc.data().seats.filter((s) => s.isAvailable === false),
          showingMovie: theaterDoc.data().showingMovie,
        })
      })

      takenSeatsByTheater.forEach((t) => {
        t.seats.forEach((s) => {
          ticketsRef
            .add({
              seatNumber: s.seatNumber,
              theaterId: t.theaterId,
              movieId: t.showingMovie,
              customerId: customersId[getRandomIndex(customersId)],
            })
            .then((docRef) => {
              console.log('Ticket added with ID: ', docRef.id)
            })
        })
      })
    })
}
