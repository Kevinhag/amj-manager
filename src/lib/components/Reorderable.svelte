<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let list: Array<{ key: string; nome: string; quantidade: number; preco: number }> = [];
	export let update = (v: any) => {};

	let container: HTMLElement;
	let picked: any;
	let marker: HTMLElement;
	let target: any;
	let direction: number;

	function comparePosition(y: number, e: Element) {
		if (!e) return;
		if (e.classList.contains('locked')) return;
		const rect = e.getBoundingClientRect();
		if (y > rect.top && y < rect.bottom) {
			if (y < rect.top + rect.height * 0.5) {
				target = e;
				direction = -1;
			} else {
				target = e;
				direction = 1;
			}
		}
	}

	async function pickItem(e: any, touch = false) {
		e.dataTransfer.setData('text/plain', '');
		picked = e.target;

		marker.style.visibility = 'visible';
		comparePosition(e.clientY, picked);
		container.insertBefore(marker, direction > 0 ? picked.nextSibling : picked);
	}

	function moveItem(e: any, touch = false) {
		e.preventDefault();
		const y = touch && e.touches.length == 1 ? e.touches[0].clientY : e.clientY;
		const elements = container.querySelectorAll('.item');
		elements.forEach((element) => {
			comparePosition(y, element);
		});
		container.insertBefore(marker, direction > 0 ? target.nextSibling : target);
	}

	function dropItem() {
		if (picked && !picked.classList.contains('locked') && target) {
			reorderItems();
		}
		picked = null;
		target = null;
		direction = 0;
		marker.style.visibility = 'hidden';
	}

	function reorderItems() {
		if (!container || !picked) {
			return;
		}

		let picked_index = list.findIndex((e) => e.key === picked.id);
		let marker_index = list.findIndex((e) => e.key === target.id);

		if (picked_index === marker_index) {
			return;
		}
		if (direction !== 0 && picked_index - direction === marker_index) {
			return;
		}

		if (picked_index > marker_index && direction > 0) {
			marker_index += direction;
		}

		if (picked_index < marker_index && direction < 0) {
			marker_index += direction;
		}

		const picked_item = list.splice(picked_index, 1)[0];
		list.splice(marker_index, 0, picked_item);
		list = list;
		update(list);
	}

	function RemoveItem(i: number) {
		list.splice(i, 1);
		list = list;
		update(list);
	}

	function updateQuantity(i: number, quantity: number) {
		list[i].quantidade = isNaN(quantity) ? 0 : quantity;
		update(list);
	}

	function updatePrice(i: number, price: string) {
		const numericValue = parseFloat(price.replace(/[^\d]/g, '')) / 100;
		list[i].preco = isNaN(numericValue) ? 0 : numericValue;
		update(list);
	}

	function getTotal(item) {
        return item.quantidade * item.preco;
    }

	function currencyFormat(currency: number) {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
			currency,
		);
	}
</script>

<div
	class="container component"
	on:dragover={moveItem}
	on:dragend={dropItem}
	on:touchmove={(e) => moveItem(e, true)}
	on:touchend={dropItem}
>
	<div class="list" bind:this={container}>
		<div bind:this={marker} class="marker" />

		{#each list as item, i}
		
			<div
				class="item"
				draggable={false}
				id={item.key}
				on:dragstart|self={pickItem}
				on:touchstart|self={(e) => pickItem(e, true)}
			>
				<div>#{i + 1}</div>
				<div class="text" title="Edit">{item.nome}</div>
				<input
					type="number"
					name="quantity"
					id="quantity"
					min="0"
					value={item.quantidade}
					on:input={(e) => updateQuantity(i, +e.target.value)}
				/>
				
				 {#if item.quantidade !== 0}
				<input
					type="text"
					name="price"
					id="price"
					min="0"
					step="10"
					value={currencyFormat(item.preco)}
					on:input={(e) => updatePrice(i, e.target.value)}
					
				/>
				{/if}
				{#if item.quantidade === 0}
				<input
					type="text"
					name="price"
					id="price"
					min="0"
					step="10"
					disabled
				/>
				{/if}
<!-- 				<input
					type="text"
					name="totalprice"
					id="totalprice"
					readonly
					value={currencyFormat(getTotal(item))}
				/> -->
				<button on:click={() => RemoveItem(i)}>DEL</button>

			</div>
		{/each}
	</div>
</div>
<!-- <div>
	<div class="item locked">
		<div class="text">Total</div>
		<div />
		<div />
		<div />
		<div class="text">
			{currencyFormat(list.reduce((acc, item) => acc + getTotal(item), 0))}
		</div>
	</div>
</div> -->

<style lang="scss">
	@import 'src/lib/styles/buttons.scss';
	div {
		box-sizing: border-box;
	}

	.container,
	.component {
		height: auto;
		padding: 0px;
		font-size: 100%;
	}

	.list {
		position: relative;
		padding: 2px;
	}

	button {
		height: 30px;
		padding: 0;
		width: auto;
		margin-top: 0;
	}
	input[type='text'],
	input[type='number'] {
		
		margin: 0px;
		padding: 0px;
		width: 100%;
		height: 28px;
		border: none;
		text-align: center;
		border-radius: 5px;
		border: 1px solid $bordercolor;
	}

	.item {
		text-transform: uppercase;
		display: grid;
		grid-template-columns: 5% 40% 10% 20% 15%;
		user-select: none;
		gap: 5px;
		width: 100%;
		min-height: 32px;
		border-radius: 2px;
		align-items: center;
		font-size: 90%;
	}

/* 	.item.locked {
		background: #60606010;
	} */

	.item div {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.text {
		padding: 0px 4px;
		translate: 0px -1px;
	}

	.item:not(.locked):hover {
		background: var(--component-bg-hover);
	}

	.marker {
		left: 0px;
		right: 0px;
		position: absolute;
		height: 2px;
		translate: 0px -50%;
		background: cyan;
		visibility: hidden;
		z-index: 1;
	}
</style>
