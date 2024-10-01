<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/components/Notification.svelte';
  
	let cars = [];
	let clients = [];
	let selectedCar = '';
	let selectedCarData = null;
	let selectedClient = '';
	let notificationMessage = '';
	let notificationType = '';
  
	let searchQuery = ''; // Armazena o valor da pesquisa do cliente
  
	onMount(() => {
	  fetchCars();
	  fetchClients();
	});
  
	async function fetchCars() {
	  try {
		const response = await fetch('http://localhost:3000/api/cars');
		cars = await response.json();
	  } catch (error) {
		console.error('Erro ao buscar carros:', error);
	  }
	}
  
	async function fetchClients() {
	  try {
		const response = await fetch('http://localhost:3000/api/clients');
		clients = await response.json();
	  } catch (error) {
		console.error('Erro ao buscar clientes:', error);
	  }
	}
  
	$: selectedCarData = cars.find((car) => car.id == selectedCar);
  
	// Filtra a lista de clientes com base na pesquisa
	$: filteredClients = clients.filter((client) => {
	  const query = searchQuery.toLowerCase();
	  return (
		client.nome.toLowerCase().includes(query) ||
		client.cpf.toLowerCase().includes(query) ||
		(client.tel && client.tel.toLowerCase().includes(query)) ||
		(client.tel2 && client.tel2.toLowerCase().includes(query))
	  );
	});
  
	function updateCar() {
	  if (!selectedCarData) {
		showNotification('Nenhum carro selecionado para atualizar', 'error');
		return;
	  }
  
	  fetch(`http://localhost:3000/api/update-car`, {
		method: 'PUT',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(selectedCarData),
	  })
		.then((response) => response.json())
		.then((data) => {
		  showNotification('Carro alterado com sucesso!', 'success');
		  console.log('Carro atualizado:', data);
		  fetchCars(); // Atualiza a lista de carros
		})
		.catch((error) => {
		  showNotification('Erro ao atualizar carro', 'error');
		  console.error('Erro ao atualizar carro:', error);
		});
	}
  
	function addCar() {
	  if (!selectedClient) {
		showNotification('Selecione um cliente para adicionar o carro', 'error');
		return;
	  }
  
	  const newCarData = {
		cliente_id: selectedClient,
		modelo: document.getElementById('modelo').value,
		marca: document.getElementById('marca').value,
		placa: document.getElementById('placa').value,
		ano: document.getElementById('ano').value,
		km: document.getElementById('km').value,
		potencia: document.getElementById('potencia').value,
		observacao: document.getElementById('observacao').value,
		obsretifica: document.getElementById('obsretifica').value,
	  };
  
	  fetch('http://localhost:3000/api/insert-car', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(newCarData),
	  })
		.then((response) => response.json())
		.then((data) => {
		  showNotification('Carro adicionado com sucesso!', 'success');
		  console.log('Carro adicionado:', data);
		  fetchCars();
		})
		.catch((error) => {
		  showNotification('Erro ao adicionar carro', 'error');
		  console.error('Erro ao adicionar carro:', error);
		});
	}
  
	function deleteCar() {
	  if (!selectedCarData || !selectedCarData.id) {
		showNotification('Nenhum carro selecionado para deletar', 'error');
		return;
	  }
  
	  fetch(`http://localhost:3000/api/delete-car/${selectedCarData.id}`, {
		method: 'DELETE',
	  })
		.then((response) => response.json())
		.then((data) => {
		  showNotification('Carro deletado com sucesso!', 'success');
		  console.log('Carro deletado:', data);
		  fetchCars(); // Atualiza a lista de carros
		  selectedCarData = null; // Reseta a seleção
		})
		.catch((error) => {
		  showNotification('Erro ao deletar carro', 'error');
		  console.error('Erro ao deletar carro:', error);
		});
	}
  
	function showNotification(message, type) {
	  notificationMessage = message;
	  notificationType = type;
	  setTimeout(() => {
		notificationMessage = '';
		notificationType = '';
	  }, 3000); // A notificação desaparecerá após 3 segundos
	}
  
	function handleClientSearch(event) {
	  searchQuery = event.target.value.toLowerCase();
	}
  </script>
  
  <section>
	<div class="title">
	  <div>
		<h2>Adicionar Carro</h2>
	  </div>
	  <div>
		<h2>Lista de Carros</h2>
	  </div>
	</div>
	<div class="main">
	  <div class="car-add">
		<!-- Campo de pesquisa para clientes -->
		<div class="client-selection">
		  <label for="client-search">Pesquisar Cliente</label>
		  <input type="text" id="client-search" placeholder="Nome, CPF ou Telefone" on:input={handleClientSearch} />
  
		  <!-- Lista de clientes -->
		  <select id="client" size="4" bind:value={selectedClient} required>
			{#each filteredClients as client (client.id)}
			  <option value={client.id}>{client.nome} - {client.cpf}</option>
			{/each}
		  </select>
		</div>
  
		<!-- Campos do carro -->
		<div class="car-fields">
		  <div class="form-car">
			<label for="modelo">Modelo</label>
			{#if selectedCarData != null}
			  <input type="text" id="modelo" bind:value={selectedCarData.modelo} />
			{:else}
			  <input type="text" id="modelo" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="marca">Marca</label>
			{#if selectedCarData != null}
			  <input type="text" id="marca" bind:value={selectedCarData.marca} />
			{:else}
			  <input type="text" id="marca" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="placa">Placa</label>
			{#if selectedCarData != null}
			  <input type="text" id="placa" bind:value={selectedCarData.placa} />
			{:else}
			  <input type="text" id="placa" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="ano">Ano</label>
			{#if selectedCarData != null}
			  <input type="text" id="ano" bind:value={selectedCarData.ano} />
			{:else}
			  <input type="text" id="ano" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="km">Kilometragem</label>
			{#if selectedCarData != null}
			  <input type="text" id="km" bind:value={selectedCarData.km} />
			{:else}
			  <input type="text" id="km" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="potencia">Potência</label>
			{#if selectedCarData != null}
			  <input type="text" id="potencia" bind:value={selectedCarData.potencia} />
			{:else}
			  <input type="text" id="potencia" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="observacao">Observação</label>
			{#if selectedCarData != null}
			  <input type="text" id="observacao" bind:value={selectedCarData.observacao} />
			{:else}
			  <input type="text" id="observacao" />
			{/if}
		  </div>
		  <div class="form-car">
			<label for="obsretifica">Observação Retífica</label>
			{#if selectedCarData != null}
			  <input type="text" id="obsretifica" bind:value={selectedCarData.obsretifica} />
			{:else}
			  <input type="text" id="obsretifica" />
			{/if}
		  </div>
		</div>
  
		<!-- Botões de ação -->
		<div class="action-buttons">
		  {#if selectedCarData != null}
			<button type="button" on:click={updateCar}>Alterar Carro</button>
			<button on:click={() => (selectedCarData = null)}>Novo Carro</button>
			<button type="button" on:click={deleteCar}>Deletar Carro</button>
		  {:else}
			<button type="button" on:click={addCar}>Adicionar Carro</button>
			<button disabled>Novo Carro</button>
			<button type="button" disabled>Deletar Carro</button>
		  {/if}
		</div>
	  </div>
  
	  <div class="cars-list">
		<select name="cars" id="cars" size="10" bind:value={selectedCar}>
		  {#each cars as car (car.id)}
			<option value={car.id}>
			  {car.marca +
				'\xa0'.repeat(15 - car.marca.length) +
				'\xa0'.repeat(5) +
				car.modelo +
				'\xa0'.repeat(15 - car.modelo.length) +
				car.placa +
				'\xa0'.repeat(15 - car.marca.length)}
			</option>
		  {/each}
		</select>
	  </div>
	</div>
	{#if notificationMessage}
	  <Notification message={notificationMessage} type={notificationType} />
	{/if}
  </section>
  
  <style lang="scss">
	@import 'src/lib/styles/buttons.scss';
	@import 'src/lib/styles/input.scss';
	@import 'src/lib/styles/select.scss';
  
	section {
	  display: flex;
	  flex-direction: column;
	  height: 100%;
	  width: 100%;
	  justify-content: center;
	  align-items: center;
  
	  .title {
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 100%;
		height: 80px;
		gap: 20px;
		> * {
		  display: flex;
		  justify-content: center;
		  align-items: center;
		  height: 100%;
		  width: 100%;
		  padding: 10px;
		}
	  }
	  .main {
		display: grid;
		grid-template-columns: 1fr 1fr;
		justify-content: space-evenly;
		gap: 20px;
		align-items: start;
		width: 100%;
		height: 90%;
		> * {
		  width: 100%;
		  height: 100%;
		}
  
		.car-add {
		  display: flex;
		  flex-direction: column;
		  align-items: center;
		  overflow-y: scroll;
		  background-color: #44444433;
		  width: 100%;
		  height: 100%;
		  gap: 10px;
		  padding: 20px;
		  border: 1px solid #cccccc33;
		  border-radius: 10px;
  
		  .client-selection {
			width: 100%;

			display: flex;
			flex-direction: column;
			gap: 5px;
  
			input {
			  width: 100%;
			  padding: 5px;
			  border-radius: 5px;
			  border: 1px solid #cccccc33;
			}
  
			select {
			  width: 100%;
			  padding: 5px;
			  height: auto; /* Ajuste conforme necessário */
			  border-radius: 5px;
			  border: 1px solid #cccccc33;
			}
		  }
  
		  .car-fields {
			width: 100%;
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-top: 10px;
  
			.form-car {
			  width: 48%;
			  display: flex;
			  flex-direction: column;
			  gap: 5px;
  
			  input {
				width: 100%;
				padding: 5px;
				border-radius: 5px;
				border: 1px solid #cccccc33;
			  }
			}
		  }
  
		  .action-buttons {
			display: flex;
			gap: 10px;
			margin-top: 10px;
  
			button {
			  padding: 10px 20px;
			  border-radius: 5px;
			  cursor: pointer;
			}
		  }
		}
  
		.cars-list {
		  display: flex;
		  flex-direction: column;
		  justify-content: center;
		  height: 100%;
		  border: 1px solid #cccccc33;
		  border-radius: 10px;
		  select {
			height: 100%;
			font: 700 14px 'Roboto Mono', Arial, sans-serif;
		  }
		}
	  }
	}
  </style>
  