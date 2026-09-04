//creates a higher order function which takes a function and passed in fn
//it returns a function with req,res,next params
export const asyncHandler = (fn) => (req, res, next) => {
  //inside the function it returns a promis that takes the original function with the parameters then catch the error as next
  Promise.resolve(fn(req, res, next)).catch(next); //next automatically create the error
};
