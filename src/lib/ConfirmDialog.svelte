<!-- src/lib/ConfirmDialog.svelte -->
<script>
    export let message = '';
    export let onConfirm;
    export let onCancel;
  
    function confirm() {
      if (onConfirm) onConfirm();
      close();
    }
  
    function cancel() {
      if (onCancel) onCancel();
      close();
    }
  
    function close() {
      const dialog = document.getElementById('confirm-dialog');
      if (dialog) dialog.style.display = 'none';
    }
  </script>
  
  <style lang="scss">
button {
	cursor: pointer;
	width: 180px;
	border: none;
	background: none;
	color: $maintextcolor;
	font-size: 1rem;
	padding: 10px 20px;
	margin-top: 10px;
	border-radius: 5px;
	background-color: #282828;
	transition: $transition;
	border: 1px solid #cccccc33;
	&[disabled] {
		background-color: #cccccc33;
		color: grey;
		cursor:default;
		&:hover {
			background-color: #cccccc33;
			color: grey;
		}
	}
	&:hover {
		background-color: $color2;
		color: $bgcolor;
	}
}

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #444;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid #e2742b;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
      z-index: 999;
    }
    .buttons {
      display: flex;
      justify-content: space-around;
    }
  </style>
  
  <div class="overlay" id="confirm-dialog">
    <div class="dialog">
      <p>{message}</p>
      <div class="buttons">
        <button on:click={confirm}>Confirmar</button>
        <button on:click={cancel}>Cancelar</button>
      </div>
    </div>
  </div>
  