import React, { useEffect, useState, useCallback } from "react";
import { useAppStore } from "../../store";
import { Button } from "../catalyst";
import { Loader } from "../loader";
import { useOutletContext } from "react-router";
import type { TTaskWithUnits } from "../../api";
import type { User } from "@supabase/supabase-js";

export const AssignmentSection: React.FC = () => {
  const { task, isAuthor } = useOutletContext<{
    task: TTaskWithUnits;
    user: User;
    isAuthor: boolean;
  }>();
  const taskId = task.id;
  const {
    assignments,
    loading,
    getAssignments,
    createAssignment,
    deleteAssignment,
  } = useAppStore((s) => s.assignmentsStore);

  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // форматтер дат
  const formatDate = useCallback((iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  useEffect(() => {
    getAssignments(taskId);
  }, [getAssignments, taskId]);

  const onAssign = async () => {
    if (!userId || !startDate) return;
    await createAssignment(taskId, userId, startDate, endDate || undefined);
    setUserId("");
    setStartDate("");
    setEndDate("");
    await getAssignments(taskId);
  };

  const onDelete = async (assignmentId: string) => {
    await deleteAssignment(taskId, assignmentId);
  };

  const current = assignments[taskId] ?? [];

  if (loading) return <Loader />;

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Assignments</h2>

      <ul className="space-y-2">
        {current.length === 0 && (
          <li className="text-gray-500">No assignments yet.</li>
        )}
        {current.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between bg-gray-50 p-3 rounded"
          >
            <span>
              {a.userEmail} — {formatDate(a.startDate)}
              {a.endDate ? ` → ${formatDate(a.endDate)}` : ""}
            </span>
            {isAuthor && <Button onClick={() => onDelete(a.id)}>Delete</Button>}
          </li>
        ))}
      </ul>

      {isAuthor && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onAssign} disabled={!userId || !startDate}>
              Assign
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
