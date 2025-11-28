import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';

export default function TaskList({ tasks }: any) {
  return (
    <AnimatePresence>
      {tasks.map((task: any) => (
        <motion.div key={task.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          <TaskCard task={task} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
