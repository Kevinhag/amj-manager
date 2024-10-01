<script>
	import Clock from '../lib/components/Clock.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores'; // Importe o store $page
  
	export let appVersion = writable('');
  
	let ready = false;
	let showPartsPopup = false;
  
	// Declaração reativa para currentPath
	$: currentPath = $page.url.pathname;
  
	onMount(async () => {
	  ready = true;
	  const version = await window.electron.getAppVersion();
	  appVersion.set(version);
	});
  
	function openPartsPopup() {
	  showPartsPopup = true;
	}
  
	function closePartsPopup() {
	  showPartsPopup = false;
	}
  </script>
  
  <div class="clock">
	<Clock />
	<span id="getAppVersion">Versão: {$appVersion}</span>
  </div>
  
  <nav class="nav-main">
	<a href="/" class:active={currentPath === '/'}>Painel</a>
	<a href="/os" class:active={currentPath === '/os'}>OS</a>
	<a href="/clients" class:active={currentPath.startsWith('/clients')}>Clientes</a>
	<a href="/cars" class:active={currentPath === '/cars'}>Carros</a>
	<a href="/parts" class:active={currentPath === '/parts'}>Peças</a>
	<a href="/checkos" class:active={currentPath === '/checkos'}>Consultar OS</a>
	<a href="/report" class:active={currentPath === '/report'}>Relatórios</a>
  </nav>
  
  <div class="slot">
	{#if ready}
	  <slot />
	{/if}
  </div>
  
  {#if showPartsPopup}
	<div class="parts-popup">
	  <!-- Conteúdo do popup de peças -->
	  <button on:click={closePartsPopup}>Fechar</button>
	</div>
  {/if}
  
  <style lang="scss">
	@import url('https://fonts.googleapis.com/css2?family=Jura:wght@300..700&family=Kanit:wght@100;200;300;400&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100;0,400;0,900;1,100;1,400;1,900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap');
  
	:global(body) {
	  margin: 0;
	  padding: 0;
	  width: 100vw;
	  height: 100vh;
	  overflow: hidden;
	}
  
	:global(main) {
	  display: grid;
	  grid-template-rows: 10% 90%;
	  grid-template-columns: 100%;
	  place-items: center;
	  justify-content: center;
	  flex-direction: column;
	  width: 100%;
	  height: 100%;
	}
  
	:global(.dim) {
	  filter: blur(5px) brightness(0.5);
	}
  
	:global(.parts-popup) {
	  position: fixed;
	  justify-content: center;
	  top: 50%;
	  left: 50%;
	  width: 70%;
	  transform: translate(-50%, -50%);
	  background-color: #fff;
	  padding: 10px;
	  border-radius: 5px;
	  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.6);
	  border: 1px solid grey;
	  z-index: 9999;
	}
  
	.slot {
	  width: 100%;
	  height: 100%;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  border-radius: 20px 20px 0 0;
	  padding: 10px;
	  background-color: #333333;
	}
  
	.nav-main {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  gap: 2%;
	  width: 100%;
	  height: 100%;
	  color: $color2;
  
	  a {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 10%;
		height: 100%;
		color: grey;
		font-family: 'Roboto', sans-serif;
		font-size: 1.2rem;
		transition: 200ms;
  
		&:hover{
			color: $color2;
			background-color: $bgcolor;
		}
		&.active {
			color: $color2;
			background-color: $bgcolor;
		}
	  }
	}
  
	.clock {
	  position: absolute;
	  top: 5px;
	  right: 10px;
	  font-size: 8pt;
	  text-align: right;
	}
  </style>
  