import { render, screen, fireEvent } from "@testing-library/react";
import { LabelManager } from "./LabelManager";
import type { CustodyLabel } from "@/lib/scheduleTypes";

const labels: CustodyLabel[] = [
  { id: "1", name: "Mom", color: "#bbf7d0" },
  { id: "2", name: "Dad", color: "#fef08a" },
];

describe("LabelManager", () => {
  it("renders existing labels with name and color swatch", () => {
    render(
      <LabelManager
        labels={labels}
        onAddLabel={jest.fn()}
        onUpdateLabel={jest.fn()}
        onDeleteLabel={jest.fn()}
      />
    );
    expect(screen.getByText("Mom")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
  });

  it("calls onAddLabel with name and color from the form", () => {
    const onAdd = jest.fn();
    render(
      <LabelManager
        labels={[]}
        onAddLabel={onAdd}
        onUpdateLabel={jest.fn()}
        onDeleteLabel={jest.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Label name"), {
      target: { value: "Mom" },
    });
    fireEvent.click(screen.getByText("Add Label"));
    expect(onAdd).toHaveBeenCalledWith("Mom", expect.any(String));
  });

  it("calls onDeleteLabel when delete button is clicked", () => {
    const onDelete = jest.fn();
    render(
      <LabelManager
        labels={labels}
        onAddLabel={jest.fn()}
        onUpdateLabel={jest.fn()}
        onDeleteLabel={onDelete}
      />
    );
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("supports inline edit and save", () => {
    const onUpdate = jest.fn();
    render(
      <LabelManager
        labels={labels}
        onAddLabel={jest.fn()}
        onUpdateLabel={onUpdate}
        onDeleteLabel={jest.fn()}
      />
    );
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue("Mom");
    fireEvent.change(nameInput, { target: { value: "Mother" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onUpdate).toHaveBeenCalledWith("1", "Mother", expect.any(String));
  });
});
