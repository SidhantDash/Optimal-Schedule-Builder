package edu.uga.devdogs.course_information.CourseSection;

import edu.uga.devdogs.course_information.Course.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    // Get a list of course sections by their subject
    @Query("SELECT cs FROM CourseSection cs WHERE cs.course.subject = :subject")
    List<CourseSection> getCoursesBySubject(@Param("subject") String subject);

    // Get a list of course sections by the instructor
    List<CourseSection> findAllByInstructor(String instructor);

    // Get a list of course sections that match the time range
    //@Query("SELECT cs FROM CourseSection cs JOIN cs.classEntity c WHERE c.startTime >= :startTime AND c.endTime <= :endTime")
    List<CourseSection> findByStartTimeGreaterThanEqualAndEndTimeLessThanEqual(LocalTime start, LocalTime end);

    List<Course> findAllCourseSectionsByCreditHours(int creditHours);

    // Find a course section by its CRN
    CourseSection findByCrn(Integer crn);

}
