const { db } = require('./firebase')

const theatersRef = db.collection('theaters')
const customersRef = db.collection('customers')
const moviesRef = db.collection('movies')
const ticketsRef = db.collection('tickets')

const questionPromises = []

// How much money was earned by selling tickets for the movie with the title “Willy's Wonderland”?
let total = 0

const q1Promise = moviesRef
  .where('title', '==', "Willy's Wonderland")
  .get()
  .then((movieSnapshot) => {
    if (!movieSnapshot.empty) {
      const movieDoc = movieSnapshot.docs[0]
      return movieDoc
    }
  })
  .then((movieDoc) => {
    return ticketsRef
      .where('movieId', '==', movieDoc.id)
      .get()
      .then((ticketSnapshot) => {
        if (!ticketSnapshot.empty) {
          const tickets = []
          ticketSnapshot.forEach((ticket) => tickets.push(ticket.data()))
          return tickets
        }
      })
  })
  .then((tickets) => {
    const ticketPromises = []
    tickets.forEach((ticket) => {
      const theaterPromises = theatersRef
        .doc(ticket.theaterId)
        .get()
        .then((theaterDoc) => {
          const theaterData = theaterDoc.data()
          theaterData.seats.forEach((seat) => {
            if (seat.seatNumber === ticket.seatNumber) {
              total += seat.price
            }
          })
        })
      ticketPromises.push(theaterPromises)
    })
    return Promise.all(ticketPromises)
  })
  .then(() => console.log(`(Question 1) Total money earned: ${total}`))

// How many seats in the Theater No.4 that are not taken?
const q2Promise = theatersRef
  .where('theaterNumber', '==', 4)
  .get()
  .then((theaterSnapshot) => {
    return theaterSnapshot.docs[0].data()
  })
  .then((theater) => {
    const seats = theater.seats
    const availableSeats = seats.filter((seat) => seat.isAvailable === true)
    console.log(`(Question 2) Available seats: ${availableSeats.length}`)
  })

// What’s the movie title that got the highest rated? Is this movie now showing?
const q3Promise = moviesRef
  .orderBy('rating', 'desc')
  .get()
  .then((movieSnapshot) => {
    return movieSnapshot.docs[0]
  })
  .then((movie) => {
    theatersRef
      .where('showingMovie', '==', movie.id)
      .get()
      .then((theaterSnapshot) => {
        if (theaterSnapshot.docs[0] === undefined) {
          console.log(
            `(Question 3) ${
              movie.data().title
            } is the highest-rated movie and it's not showing now.`
          )
        } else {
          console.log(
            `(Question 3) ${
              movie.data().title
            } is the highest-rated movie and it's now showing.`
          )
        }
      })
  })

// What's the customer name that bought more than one ticket for the same movie?
const q4Promise = ticketsRef
  .get()
  .then((ticketSnapshot) => {
    const tickets = []
    ticketSnapshot.forEach((ticketDoc) =>
      tickets.push({ ticketId: ticketDoc.id, ...ticketDoc.data() })
    )
    return tickets
  })
  .then((tickets) => {
    const uniqeTickets = []
    for (let i = 1; i < tickets.length; i++) {
      for (let j = 0; j < i; j++) {
        if (tickets[i].customerId === tickets[j].customerId) {
          if (tickets[i].movieId === tickets[j].movieId) {
            uniqeTickets.push(tickets[i])
          }
        }
      }
    }
    return uniqeTickets
  })
  .then((uniqeTickets) => {
    const customerPromises = []
    uniqeTickets.forEach((ut) => {
      const promise = customersRef
        .doc(ut.customerId)
        .get()
        .then((customerDoc) => {
          return new Promise((resolve) => {
            const customerData = customerDoc.data()
            resolve(`${customerData.firstName} ${customerData.lastName}`)
          })
        })
      customerPromises.push(promise)
    })
    return Promise.all(customerPromises)
  })
  .then((customers) => {
    console.log(
      '(Question 4) List of the customers who bought more than one ticket for the same movie'
    )
    customers.forEach((c, i) => console.log(`${i + 1}. ${c}`))
  })

// The Customer named “Chandra Beard” lost her ticket. She wanted to know the seat that she took,
// so she went to the counter and asked for an employee for the theater number,
// seat number and the movie title.
const q5Promise = customersRef
  .where('firstName', '==', 'Chandra')
  .where('lastName', '==', 'Beard')
  .get()
  .then((customerSnapshot) => {
    return customerSnapshot.docs[0]
  })
  .then((customer) => {
    ticketsRef
      .where('customerId', '==', customer.id)
      .get()
      .then((ticketSnapshot) => {
        return ticketSnapshot.docs[0]
      })
      .then((ticket) => {
        infomationPromises = [ticket.data().seatNumber]

        const theaterPromise = theatersRef
          .doc(ticket.data().theaterId)
          .get()
          .then((theaterDoc) => {
            return theaterDoc.data().theaterNumber
          })
        infomationPromises.push(theaterPromise)

        const moviePromise = moviesRef
          .doc(ticket.data().movieId)
          .get()
          .then((movieDoc) => {
            return movieDoc.data().title
          })
        infomationPromises.push(moviePromise)

        return Promise.all(infomationPromises)
      })
      .then((information) => {
        const [seatNumber, theaterNumber, movieTitle] = information
        console.log(
          `(Question 5) ${movieTitle}: seat ${seatNumber}, theater no.${theaterNumber}`
        )
      })
  })

questionPromises.push(q1Promise, q2Promise, q3Promise, q4Promise, q5Promise)
Promise.all(questionPromises).then(() => process.exit(0))
