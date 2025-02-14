<template>
    <header>
      <h1>FCMarkt</h1>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
    </header>
  </template>
  
  <script>
  export default {
    name: 'Header',
  };
  </script>
  
  <style scoped>
  header {
    background-color: #1a1a1a;
    color: white;
    padding: 1rem;
    text-align: center;
  }
  nav a {
    margin: 0 1rem;
    color: white;
    text-decoration: none;
  }
  nav a:hover {
    text-decoration: underline;
  }
  </style>