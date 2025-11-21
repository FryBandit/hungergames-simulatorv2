import React from 'react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-holo-500 rounded-lg shadow-[0_0_30px_rgba(14,165,233,0.3)] relative">
        <div className="p-4 border-b border-holo-800 flex justify-between items-center bg-slate-950 rounded-t-lg">
          <h2 className="text-holo-400 font-bold tracking-widest uppercase text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-xl">×</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;