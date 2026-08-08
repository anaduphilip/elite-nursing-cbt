// src/components/common/BadgeCelebrationChecker.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { BadgeAwardModal } from './BadgeAwardModal';

export const BadgeCelebrationChecker = ({ children }) => {
  const { token, darkMode } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkBadges = async () => {
      if (!token) {
        setChecked(true);
        return;
      }

      try {
        const res = await axios.get('/api/gamification/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const earnedBadgeIds = res.data.earnedBadgeIds || [];
          const storedIds = JSON.parse(localStorage.getItem('badgeIds') || '[]');

          // Find newly earned badges (present in server, not in storage)
          const newIds = earnedBadgeIds.filter(id => !storedIds.includes(id));

          if (newIds.length > 0) {
            // Get full badge details for the new ones
            const allBadges = res.data.badges || [];
            const newBadgeDetails = allBadges.filter(b => newIds.includes(b._id));
            setNewBadges(newBadgeDetails);
            setShowModal(true);
            // Update stored IDs
            localStorage.setItem('badgeIds', JSON.stringify(earnedBadgeIds));
          }
        }
      } catch (error) {
        console.error('Failed to check badge updates:', error);
      } finally {
        setChecked(true);
      }
    };

    checkBadges();
  }, [token]);

  const closeModal = () => {
    setShowModal(false);
    setNewBadges([]);
  };

  return (
    <>
      {children}
      {showModal && (
        <BadgeAwardModal
          badges={newBadges}
          onClose={closeModal}
          darkMode={darkMode}
        />
      )}
    </>
  );
};