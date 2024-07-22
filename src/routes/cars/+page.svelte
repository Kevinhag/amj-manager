<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/Notification.svelte';
  
	let cars = [];
	let clients = [];
	let clientCars = [];
	let selectedCar = '';
	let selectedCarData = null;
	let selectedClient = '';
	let notificationMessage = '';
	let notificationType = '';
  
	onMount(() => {
	  fetch('http://localhost:3000/api/cars')
		.then((response) => response.json())
		.then((data) => {
		  cars = data;
		  console.log(data);
		});
  
	  fetch('http://localhost:3000/api/clients')
		.then((response) => response.json())
		.then((data) => {
		  clients = data;
		  console.log(data);
		});
	});
  
	$: selectedCarData = cars.find((car) => car.id == selectedCar);
  
	function updateCar() {
	  fetch(`http://localhost:3000/api/update-car`, {
		method: 'PUT',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(selectedCarData),
	  })
		.then((response) => response.text())
		.then((data) => {
		  showNotification('Carro alterado com sucesso!', 'success');
		  console.log('Car updated:', data);
		  fetchCars(); // Atualiza a lista de carros
		})
		.catch((error) => {
		  showNotification('Erro ao atualizar carro', 'error');
		  console.error('Erro ao atualizar carro:', error);
		});
	}
  
	function addCar() {
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
		  console.log('Car added:', data);
		  fetchCars(); // Atualiza a lista de carros
		})
		.catch((error) => {
		  showNotification('Erro ao adicionar carro', 'error');
		  console.error('Erro ao adicionar carro:', error);
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
  
	function fetchCars() {
	  fetch('http://localhost:3000/api/cars')
		.then((response) => response.json())
		.then((data) => {
		  cars = data;
		});
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
		<div class="form-car">
		  <label for="client">Cliente</label>
		  <select id="client" bind:value={selectedClient} required>
			<option value="">Selecione um cliente</option>
			{#each clients as client (client.id)}
			  <option value={client.id}>{client.nome}</option>
			{/each}
		  </select>
		</div>
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
		<div>
		  {#if selectedCarData != null}
			<button type="button" on:click={updateCar}>Alterar Carro</button>
		  {:else}
			<button type="button" on:click={addCar}>Adicionar Carro</button>
		  {/if}
		  {#if selectedCarData != null}
			<button on:click={() => (selectedCarData = null)}>Novo Carro</button>
		  {:else}
			<button disabled>Novo Carro</button>
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
		align-items: end;
		width: 100%;
		height: 100%;
		> * {
		  width: 100%;
		  height: 100%;
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
		.car-add {
		  display: flex;
		  justify-content: center;
		  align-items: center;
		  background-color: #44444433;
		  flex-wrap: wrap;
		  width: 100%;
		  height: 100%;
		  gap: 10px;
		  padding: 20px;
		  border: 1px solid #cccccc33;
		  border-radius: 10px;
  
		  .form-car {
			width: 40%;
			display: flex;
			flex-direction: column;
			gap: 5px;
			input, select {
			  font: 700 14px 'Roboto Mono', Arial, sans-serif;
			  padding: 5px;
			  border-radius: 5px;
			  border: 1px solid #cccccc33;
			}
		  }
		}
	  }
	}
  </style>
  