# Social Media App

## ⚠️ Notice

![Warning](https://img.shields.io/badge/Warning-Render%20Server%20Sleeps%20🛑-red)

> The backend on **Render** goes to sleep when idle, causing a **slow first load (cold start)** when you open the Netlify site.


---
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![Apollo Server](https://img.shields.io/badge/Apollo%20GraphQL-311C87?&style=for-the-badge&logo=apollo-graphql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white)

A full-stack social media application built with a modern technology stack, allowing users to connect and share content.

## Demo Link

[Live Project Demo](https://secrettalksonly.netlify.app/)

## Project Overview

The primary goal was to understand core concepts such as full-stack development, API design with GraphQL, database management with an ORM, and modern frontend development with a component-based
framework. This project serves as a practical implementation of building a scalable and maintainable web application from scratch.

## Project Structure
```
Social-Media-App/
├───backend/
│   ├───prisma/
│   ├───src/
│   │   ├───generated/
│   │   ├───lib/
│   │   ├───modules/
│   │   └───utils/
│   ├───.env
│   ├───codegen.yml
│   ├───package.json
│   ├───schema.graphql
│   └───tsconfig.json
└───frontend/
    ├───src/
    │   ├───context/
    │   ├───features/
    │   │   ├───auth/
    │   │   ├───post/
    │   │   └───user/
    │   └───styles/
    ├───.env
    ├───index.html
    ├───package.json
    └───vite.config.ts
```

## Features

-   **User Authentication:** Secure user sign-up and login functionality using JWT.
-   **Profile Management:** Users can view and edit their profiles, including bio and profile picture.
-   **Post Creation:** Users can create new posts with text content and images.
-   **Image Uploads:** Seamless image uploading and hosting via Cloudinary.
-   **Interactive Feed:** A central home feed displaying posts from users.
-   **Likes & Comments:** Users can like, unlike, and comment on posts.
-   **Responsive Design:** Fully responsive layout for a great experience on any device.

## Technologies Used

### Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **API:** Apollo Server, GraphQL
-   **Database ORM:** Prisma
-   **Database:** PostgreSQL
-   **Authentication:** JWT (JSON Web Tokens), bcryptjs
-   **Image Hosting:** Cloudinary
-   **Language:** TypeScript

### Frontend

-   **Framework:** React
-   **Build Tool:** Vite
-   **API Client:** Apollo Client
-   **Routing:** React Router
-   **Styling:** Tailwind CSS, SASS/SCSS
-   **Language:** TypeScript
-   **State Management:** React Context API

## Future Enhancements

-   [ ] Real-time notifications for likes, comments, and new followers.
-   [ ] Direct messaging feature between users.
-   [ ] User following system.
-   [ ] Advanced search functionality for users and posts.
-   [ ] Infinite scrolling for the post feed.
-   [ ] Password reset functionality via email.
-   [ ] AuthO login with Google, Facebook, and Apple.
-   [ ] Deploy backend to a cloud service like Heroku or AWS.
