const CloseButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="modal-close-button"
    >
      ✕
    </button>
  );
};

export default CloseButton;