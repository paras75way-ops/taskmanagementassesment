import { useState } from "react";
import BoardSelector from "./BoardSelector";
import { XIcon } from "../../assets/icons";

interface MoveToBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBoardId: string;
    onConfirm: (targetBoardId: string) => void;
}

export default function MoveToBoardModal({ isOpen, onClose, currentBoardId, onConfirm }: MoveToBoardModalProps) {
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Move to Board</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Destination
                    </label>
                    <BoardSelector
                        value={selectedBoardId}
                        onChange={setSelectedBoardId}
                        placeholder="Choose target board..."
                    />

                    {selectedBoardId === currentBoardId && (
                        <p className="mt-2 text-sm text-amber-600">Task is already in this board.</p>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedBoardId || selectedBoardId === currentBoardId}
                            onClick={() => {
                                if (selectedBoardId) onConfirm(selectedBoardId);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                        >
                            Move Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
