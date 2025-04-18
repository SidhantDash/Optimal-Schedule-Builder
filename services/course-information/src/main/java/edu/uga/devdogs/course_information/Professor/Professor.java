package edu.uga.devdogs.course_information.Professor;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;

import java.io.Serializable;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

import edu.uga.devdogs.course_information.Class.ClassEntity;



@Entity
public class Professor implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int professorId;

    private String firstName;
    private String lastName;
    private int totalReviews = 0;
    private float averageRating = 0.0f;
    private float difficultyRating = 0.0f;
    private int wouldTakeAgainRating;
    private String department;


    @OneToMany(mappedBy = "professor", fetch = FetchType.LAZY)
    @JsonManagedReference("professor-classes")
    private List<ClassEntity> classes;


    // Default constructor
    public Professor() {

    }

    // Constructor without ID
    public Professor(String firstName, String lastName, int totalReviews, float rating, float difficultyRating, int wouldTakeAgainRating, String department) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.totalReviews = totalReviews;
        this.averageRating = rating;
        this.difficultyRating = difficultyRating;
        this.wouldTakeAgainRating = wouldTakeAgainRating;
        this.department = department;
    }

    // Constructor with ID
    public Professor(int professorId, String firstName, String lastName, int totalReviews, float averageRating, float difficultyRating, int wouldTakeAgainRating, List<ClassEntity> classes) {
        this.professorId = professorId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.totalReviews = totalReviews;
        this.averageRating = averageRating;
        this.difficultyRating = difficultyRating;
        this.wouldTakeAgainRating = wouldTakeAgainRating;
        this.classes = classes;
    }

    // Getters and Setters
    public int getProfessorId() {
        return professorId;
    }
public void setProfessorId(int professorId) {
        this.professorId = professorId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public int getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(int totalReviews) {
        this.totalReviews = totalReviews;
    }

    public float getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(float averageRating) {
        this.averageRating = averageRating;
    }

    public float getDifficultyRating() {
        return difficultyRating;
    }

    public void setDifficultyRating(float difficultyRating) {
        this.difficultyRating = difficultyRating;
    }

    public int getWouldTakeAgainRating() {
        return wouldTakeAgainRating;
    }

    public void setWouldTakeAgainRating(int wouldTakeAgainRating) {
        this.wouldTakeAgainRating = wouldTakeAgainRating;
    }

    public List<ClassEntity> getClasses() {
        return classes;
    }

    public void setClasses(List<ClassEntity> classes) {
        this.classes = classes;
    }

    public Professor orElseThrow(Object object) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'orElseThrow'");
    }
}