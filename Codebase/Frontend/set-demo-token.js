// Simple script to set demo token in localStorage
// Run this in browser console or save as bookmark

const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlN2U2OTNiYi00ZjJmLTQ4NzItODY2MS1kZDIyNjI0MzRiMjYiLCJlbWFpbCI6ImRlbW9AZ21haWwuY29tIiwiaWF0IjoxNzU4MzA5MzYyLCJleHAiOjE3NTgzOTU3NjJ9.a1nnRLu-yv9n6kUHspEpjkezsvdMy0DsDn2rRKhE-yE';

if (typeof window !== 'undefined') {
  localStorage.setItem('grip-invest-token', demoToken);
  console.log('Demo token set successfully!');
  console.log('Now refresh the profile page to see the data.');
} else {
  console.log('This script should be run in a browser environment.');
}