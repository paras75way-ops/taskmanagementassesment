import { useLiveQuery } from "dexie-react-hooks";
import Select from "react-select";
import { db } from "../../lib/db";

interface BoardSelectorProps {
    value: string | null;
    onChange: (boardId: string) => void;
    className?: string;
    placeholder?: string;
}

export default function BoardSelector({ value, onChange, className, placeholder = "Select a board..." }: BoardSelectorProps) {
    const boards = useLiveQuery(() => db.boards.where("syncStatus").notEqual("deleted").toArray());

    const options = boards?.map(b => ({ value: b._id, label: b.name })) || [];
    const selectedOption = options.find(o => o.value === value) || null;

    return (
        <div className={className}>
            <Select
                options={options}
                value={selectedOption}
                onChange={(option) => {
                    if (option) onChange(option.value);
                }}
                placeholder={placeholder}
                isLoading={boards === undefined}
                classNamePrefix="react-select"
                styles={{
                    control: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        borderColor: "#d1d5db",
                        boxShadow: "none",
                        "&:hover": {
                            borderColor: "#9ca3af",
                        },
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#e0e7ff" : "white",
                        color: state.isSelected ? "white" : "#111827",
                        "&:active": {
                            backgroundColor: "#4f46e5",
                        },
                    }),
                }}
            />
        </div>
    );
}
