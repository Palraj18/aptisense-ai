let interviewSession = {
  category: "",
  answers: [],
  completed: false
};

export const setInterviewCategory = (category) => {
  interviewSession.category = category;
};

export const addInterviewAnswer = (data) => {
  interviewSession.answers.push(data);
};

export const completeInterview = () => {
  interviewSession.completed = true;
};

export const getInterviewSession = () => {
  return interviewSession;
};

export const resetInterviewSession = () => {
  interviewSession = {
    category: "",
    answers: [],
    completed: false
  };
};