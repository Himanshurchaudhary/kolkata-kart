import { useState } from "react";
import ComboListPage from "./ComboList";
import AddComboPage  from "./Addcombopage";

export default function CombosPage() {
    const [view,         setView]         = useState("list");
    const [editingCombo, setEditingCombo] = useState(null);

    if (view === "add") {
        return (
            <AddComboPage
                onSaved={() => setView("list")}
                onCancel={() => setView("list")}
            />
        );
    }

    if (view === "edit") {
        return (
            <AddComboPage
                existingCombo={editingCombo}
                onSaved={() => { setView("list"); setEditingCombo(null); }}
                onCancel={() => { setView("list"); setEditingCombo(null); }}
            />
        );
    }

    return (
        <ComboListPage
            onAddNew={() => setView("add")}
            onEdit={(combo) => { setEditingCombo(combo); setView("edit"); }}
        />
    );
}