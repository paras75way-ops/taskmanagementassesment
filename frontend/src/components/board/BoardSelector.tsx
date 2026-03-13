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
                        borderColor: "rgb(209, 213, 219)",
                        boxShadow: "none",
                        "&:hover": {
                            borderColor: "rgb(156, 163, 175)",
                        },
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "rgb(79, 70, 229)" : state.isFocused ? "rgb(224, 231, 255)" : "white",
                        color: state.isSelected ? "white" : "rgb(17, 24, 39)",
                        "&:active": {
                            backgroundColor: "rgb(79, 70, 229)",
                        },
                    }),
                }}
            />
        </div>
    );
}
