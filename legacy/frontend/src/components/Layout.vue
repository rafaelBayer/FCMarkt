<template>
    <div>
      <Header />
      <main>
        <slot></slot> <!-- Aqui o conteúdo da página será injetado -->
      </main>
      <Footer />
    </div>
  </template>
  
  <script>
  import Header from './Header.vue';
  import Footer from './Footer.vue';
  
  export default {
    name: 'Layout',
    components: {
      Header,
      Footer,
    },
  };
  </script>
  
  <style scoped>
  main {
    padding: 2rem;
  }
  </style>